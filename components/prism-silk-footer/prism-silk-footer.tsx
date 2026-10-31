"use client"

// Prism Silk Footer — an airy site footer that sits above a bolt of iridescent
// silk. Five folds of fabric, each one a soft dune of shifting colour with
// threads of light running along it, recede into a pale haze, and the whole
// thing is printed through a coarse, living film grain.
//
// Storyboard. Before the footer is in view it is only paper and grain. When a
// fifth of it scrolls on screen the grain flares like film coming up in the
// developer, the folds rise out of the bottom edge back to front, each one
// overshooting and settling like cloth thrown over a line, and the colour
// blooms out of grey. Meanwhile the brand mark folds open slat by slat, the
// name rises letter by letter out of a blur, the tagline and social chips
// follow, every column's heading and links cascade in, the hairline draws
// itself left to right with a prism glint running along it, and the bottom
// row settles last.
//
// Afterwards the silk keeps breathing. Move across it and the crests reach up
// toward the pointer like fabric lifted by a fingertip, while the sheen shifts
// hue as if you were tilting foil. Click the silk and a ripple runs out through
// every fold. Hover a column and the whole bolt turns to that column's colour.
// Links roll over into a prism gradient, the social chips catch an iridescent
// edge, the heart in the credit beats and bursts when pressed, and the arrow
// takes you back to the top.
//
// One file, React only. A single WebGL2 fragment shader for the silk (with a
// CSS gradient if WebGL2 is missing), real anchors for every link, a scoped
// <style> where every rule is .psf- prefixed, and nothing fetched.

import * as React from "react"

export interface PrismSilkPalette {
  /** Paper at the top of the footer. Also the background before WebGL paints. */
  paperTop: string
  /** Paper at the horizon, where the silk dissolves into the haze. */
  paperLow: string
  /** The glow that hangs just above the silk. */
  glow: string
  /** Body text and the brand. */
  ink: string
  /** Links, tagline and the bottom row. */
  muted: string
  /** The hairline. */
  line: string
  /** Fill of the social chips and back-to-top button. */
  chip: string
  /** The heart in the credit. */
  heart: string
  /** Five silk colours, cycled around the folds. Hex only. */
  silk: string[]
  /** Dark footers lighten instead of darken their sheen. */
  dark: boolean
}

export type PrismSilkTheme = "prism" | "opal" | "ember" | "nocturne"

export type PrismSilkPreset = "auto" | PrismSilkTheme

export interface PrismSilkLink {
  label: string
  href?: string
  /** A small pill after the label, e.g. "New" or "Hiring". */
  badge?: string
}

export interface PrismSilkColumn {
  title: string
  links: PrismSilkLink[]
}

export type PrismSilkSocialIcon = "x" | "instagram" | "linkedin" | "youtube" | "github" | "dribbble"

export interface PrismSilkSocial {
  icon: PrismSilkSocialIcon
  href?: string
  /** Accessible name and tooltip. Defaults to the network's name. */
  label?: string
}

export interface PrismSilkFooterProps {
  /** Brand name beside the mark. */
  name?: string
  /** Where the brand links to. */
  brandHref?: string
  /** Replace the built-in prism-fold mark. */
  logo?: React.ReactNode
  /** The line under the brand. "" hides it. */
  tagline?: string
  /** Link columns. */
  columns?: PrismSilkColumn[]
  /** Social chips under the tagline. */
  socials?: PrismSilkSocial[]
  /** Bottom-left line. Defaults to "© <year> <name>, Inc. All rights reserved." */
  copyright?: string
  /** "Made with ♥ by …" on the right. Pass null to hide it. */
  credit?: { label: string; href?: string } | null
  /** Show the back-to-top button. Defaults to true. */
  backToTop?: boolean
  /** Colours. "auto" is prism, or nocturne under a .dark ancestor. */
  preset?: PrismSilkPreset
  /** Colour overrides, merged over the preset. */
  palette?: {
    paperTop?: string
    paperLow?: string
    glow?: string
    ink?: string
    muted?: string
    line?: string
    chip?: string
    heart?: string
    silk?: string[]
    dark?: boolean
  }
  /** Which bolt of silk to weave. Any number. Defaults to 3. */
  seed?: number
  /** How fast the silk breathes. 0 holds it still. Defaults to 1. */
  speed?: number
  /** Film grain strength, 0–1.5. Defaults to 0.8. */
  grain?: number
  /** Size of one grain speck in CSS px. Defaults to 2. */
  grainSize?: number
  /** Pointer lift, foil tilt, click ripples and column tints. Defaults to true. */
  interactive?: boolean
  /** Highest device-pixel ratio the silk renders at. Defaults to 1.5. */
  maxDpr?: number
  /** Widest the content gets. Defaults to "1180px". */
  maxWidth?: string
  /** Face for all type. Comes from the host page. */
  fontFamily?: string
  /** Root height. A definite length, never a percentage. The footer grows past it when its content needs more room. */
  height?: string
  /** The least height the silk itself gets. Defaults to "300px". */
  stageMinHeight?: string
  /** Extra root class names. */
  className?: string
}

const PRESETS: PrismSilkPresetMap = {
  prism: {
    paperTop: "#eef2fa",
    paperLow: "#fae4e6",
    glow: "#f7c9d6",
    ink: "#111116",
    muted: "#4d4d58",
    line: "rgba(17, 17, 22, 0.16)",
    chip: "rgba(255, 255, 255, 0.55)",
    heart: "#2a2a31",
    silk: ["#ff3f86", "#ff6236", "#d9cf6a", "#5a63f0", "#a98cf4"],
    dark: false,
  },
  opal: {
    paperTop: "#eef6f6",
    paperLow: "#e3eef8",
    glow: "#cfe6f2",
    ink: "#0f1a1f",
    muted: "#4a5a63",
    line: "rgba(15, 26, 31, 0.15)",
    chip: "rgba(255, 255, 255, 0.55)",
    heart: "#1f6f8b",
    silk: ["#18c2b0", "#3f86ff", "#b58cff", "#ffb0cc", "#9ff0c8"],
    dark: false,
  },
  ember: {
    paperTop: "#fbf4ec",
    paperLow: "#fbe2d2",
    glow: "#f9c7a8",
    ink: "#1d120c",
    muted: "#5e4a3e",
    line: "rgba(29, 18, 12, 0.16)",
    chip: "rgba(255, 255, 255, 0.5)",
    heart: "#d6452f",
    silk: ["#ff4a2a", "#ffae2b", "#ff2f86", "#7b3cff", "#ff7d5a"],
    dark: false,
  },
  nocturne: {
    paperTop: "#08080d",
    paperLow: "#150c1b",
    glow: "#3a1532",
    ink: "#f4f2f8",
    muted: "#a3a0b2",
    line: "rgba(244, 242, 248, 0.14)",
    chip: "rgba(255, 255, 255, 0.05)",
    heart: "#ff5d8f",
    silk: ["#ff3f86", "#ff6236", "#d9cf6a", "#5a63f0", "#a98cf4"],
    dark: true,
  },
}

const DEFAULT_COLUMNS: PrismSilkColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features" },
      { label: "Integrations" },
      { label: "Pricing" },
      { label: "Changelog", badge: "New" },
      { label: "Roadmap" },
      { label: "Security" },
    ],
  },
  {
    title: "Company",
    links: [{ label: "About Us" }, { label: "Careers", badge: "Hiring" }, { label: "Press Kit" }, { label: "Partners" }, { label: "Contact" }],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog" },
      { label: "Documentation" },
      { label: "API Reference" },
      { label: "Help Center" },
      { label: "Community" },
      { label: "Tutorials" },
      { label: "Webinars" },
    ],
  },
  {
    title: "Legal",
    links: [{ label: "Privacy Policy" }, { label: "Terms of Service" }, { label: "Cookie Policy" }, { label: "Compliance" }, { label: "Sitemap" }],
  },
]

const DEFAULT_SOCIALS: PrismSilkSocial[] = [
  { icon: "x", href: "https://x.com" },
  { icon: "instagram", href: "https://instagram.com" },
  { icon: "linkedin", href: "https://linkedin.com" },
  { icon: "youtube", href: "https://youtube.com" },
]

const SOCIAL_NAMES: PrismSilkSocialNameMap = {
  x: "X",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  github: "GitHub",
  dribbble: "Dribbble",
}

const SANS_STACK = '"Inter", "Inter Variable", "Geist", "Helvetica Neue", Arial, system-ui, sans-serif'

/** Milliseconds from "in view" to the silk fully settled. */
const REVEAL_MS = 2800

// #region silk
// Pure helpers, lifted out and executed by tests/prism-silk-footer.test.mjs.

/** Hex → [r, g, b] in 0–1, or null for anything that isn't #rgb / #rrggbb. */
export function psfHex(hex: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
}

/** Exactly five silk colours: short lists cycle, long lists are cut, bad entries fall back. */
export function psfFive(list: string[] | undefined, fallback: string[]) {
  const src = (list || []).filter((c) => psfHex(c) !== null)
  const use = src.length ? src : fallback
  return [0, 1, 2, 3, 4].map((i) => use[i % use.length])
}

export function psfClamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v
}

/** Ease out with a small overshoot — cloth thrown over a line, then settling. Ends exactly at 1. */
export function psfEaseBack(t: number) {
  if (!(t > 0)) return 0
  if (t >= 1) return 1
  const x = t - 1
  const s = 1.45
  return 1 + (s + 1) * x * x * x + s * x * x
}

/** How far fold `i` of `n` (0 = farthest) has risen, for an overall reveal of 0–1. Back folds rise first. */
export function psfLayerRise(reveal: number, i: number, n: number) {
  const lead = 0.4 / Math.max(n - 1, 1)
  return psfEaseBack((reveal - 0.06 - i * lead) / 0.52)
}

/** Grain re-rolls at its own frame rate, not the display's. Small integers only, so a float32 hash stays exact. */
export function psfGrainFrame(seconds: number, fps: number) {
  if (!(seconds >= 0) || !(fps > 0)) return 0
  return Math.floor(seconds * Math.min(fps, 60)) % 997
}

/** Frame-rate independent exponential approach. dt in seconds, rate per second. */
export function psfApproach(current: number, target: number, dt: number, rate: number) {
  const k = 1 - Math.exp(-psfClamp(dt, 0, 0.1) * rate)
  return current + (target - current) * k
}

/** Hue turn for hovering column `i` of `n`: evenly spread through ±0.3 of the palette cycle, never 0. */
export function psfColumnHue(i: number, n: number) {
  if (n <= 0) return 0
  return ((i + 1) / (n + 1) - 0.5) * 0.6 + (n % 2 ? 0.06 : 0)
}

/** Where the silk's top edge sits, as a height in CSS px measured up from the root's bottom. */
export function psfStageHeight(rootHeight: number, stageTop: number) {
  return Math.max(rootHeight - stageTop, 80)
}

// #endregion

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}`

// Silk in "stage units": Y = 0 at the bottom edge, Y = 1 at the top of the
// stage (just under the bottom row), X runs in the same units so the folds keep
// their shape at any width.
const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uStageH;
uniform float uTime;
uniform float uReveal;
uniform float uLayers[5];
uniform vec3 uPaperTop;
uniform vec3 uPaperLow;
uniform vec3 uGlow;
uniform vec3 uC[5];
uniform float uHue;
uniform vec3 uPtr;
uniform vec4 uRip[4];
uniform float uGrain;
uniform float uGrainPx;
uniform float uFrame;
uniform float uDark;
uniform float uSeed;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise1(float x, float s) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash(vec2(i, s)), hash(vec2(i + 1.0, s)), u);
}
vec3 pal(float x) {
  x = fract(x) * 5.0;
  int i = int(floor(x));
  int j = i == 4 ? 0 : i + 1;
  float f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(uC[i], uC[j], f);
}

float crestOf(float X, int k, float t) {
  float i = float(k);
  float fi = i / 4.0;
  float s = uSeed * 0.731 + i * 1.618;
  float base = mix(0.9, 0.28, fi);
  float amp = mix(0.14, 0.22, fi);
  // A swell with a skewed second harmonic: long windward slopes, rolled crests.
  float u = X * mix(0.85, 1.3, fract(s * 0.73)) + s * 3.1 + t * 0.19 * (1.0 + i * 0.13);
  float y = base
    + amp * (sin(u) + 0.32 * sin(2.0 * u + 1.1))
    + amp * 0.42 * sin(X * mix(2.0, 2.8, fract(s * 1.31)) - s * 1.7 - t * 0.15)
    + 0.1 * (noise1(X * 1.1 + t * 0.07, s * 9.0) - 0.5);
  // The pointer lifts the crests toward it, nearer folds more.
  float g = exp(-pow((X - uPtr.x) / 0.45, 2.0));
  float pull = (min(uPtr.y, 1.02) - y) * 0.42 * g * uPtr.z * mix(0.45, 1.0, fi);
  y += clamp(pull, -0.1, 0.28);
  // Click ripples: a wave packet running outward along every fold.
  for (int r = 0; r < 4; r++) {
    vec4 rp = uRip[r];
    if (rp.z <= 0.0) continue;
    float d = abs(X - rp.x) - rp.y * 1.5;
    y += rp.z * 0.06 * sin(d * 13.0) * exp(-d * d * 7.0) * exp(-rp.y * 1.2) * mix(0.6, 1.0, fi);
  }
  // Reveal: each fold climbs out of the bottom edge.
  return mix(-0.3 - i * 0.07, y, uLayers[k]);
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  float X = fc.x / uStageH;
  float Y = fc.y / uStageH;
  float t = uTime;
  float topY = uRes.y / uStageH;

  // Paper: cool at the top, warming into the haze at the horizon.
  float sv = clamp((Y - 0.55) / max(topY - 0.55, 0.01), 0.0, 1.0);
  vec3 col = mix(uPaperLow, uPaperTop, smoothstep(0.0, 1.0, sv));
  float glow = exp(-pow((Y - 0.92) / 0.5, 2.0)) * (0.65 + 0.35 * sin(X * 0.8 + t * 0.12 + uSeed));
  col = mix(col, uGlow, glow * 0.5 * smoothstep(0.0, 0.6, uReveal));

  for (int k = 0; k < 5; k++) {
    float i = float(k);
    float fi = i / 4.0;
    float r = crestOf(X, k, t);
    float soft = mix(0.085, 0.011, fi);
    // A soft shadow just above each nearer crest keeps the folds apart.
    float lift = Y - r;
    float occ = exp(-max(lift, 0.0) * 9.0) * step(0.0, lift) * mix(0.0, 0.32, fi) * uLayers[k];
    col = mix(col, col * mix(vec3(0.62, 0.55, 0.7), vec3(0.45), uDark), occ);
    float c = smoothstep(r + soft, r - soft, Y);
    if (c <= 0.001) continue;
    float d = max(r - Y, 0.0);
    // Threads of light running along the fold.
    float wob = noise1(X * 1.6 + t * 0.05, i * 13.0 + uSeed) * 2.6;
    float threads = pow(0.5 + 0.5 * sin(d * mix(16.0, 28.0, fi) + wob + X * 0.6 - t * 0.18), 6.0);
    float crest = exp(-d * mix(7.0, 14.0, fi));
    float shade = mix(1.0, mix(0.4, 0.68, uDark), smoothstep(0.02, 0.45, d));
    float ph = uHue + i * 0.19 + X * 0.085 + d * 0.8 + 0.06 * sin(t * 0.23 + X * 1.3 + i);
    vec3 sc = pal(ph) * shade;
    vec3 sheen = mix(vec3(1.0), pal(ph + 0.45), 0.3);
    sc = mix(sc, sheen, crest * mix(0.5, 0.32, uDark));
    sc += threads * 0.24 * (1.0 - min(d, 1.0) * 0.7) * mix(vec3(1.0), pal(ph + 0.2), 0.5);
    // The far folds recede into the haze.
    sc = mix(sc, mix(uPaperLow, uGlow, 0.4), mix(0.5, 0.0, fi * fi * (3.0 - 2.0 * fi)));
    // Colour blooms out of grey as the silk rises.
    float lum = dot(sc, vec3(0.299, 0.587, 0.114));
    sc = mix(mix(vec3(lum), uPaperLow * lum * 1.08, 0.45), sc, smoothstep(0.1, 0.8, uReveal));
    col = mix(col, sc, c);
  }

  // Film grain: coloured and mono specks on their own clock, heavier while developing.
  vec2 cell = floor(fc / uGrainPx);
  vec3 g = vec3(
    hash(cell + uFrame * vec2(7.13, 3.31)),
    hash(cell + uFrame * vec2(1.71, 9.23) + 31.7),
    hash(cell + uFrame * vec2(4.37, 2.93) + 71.1)
  ) - 0.5;
  float mono = hash(cell * 1.31 + uFrame * 1.97 + 5.3) - 0.5;
  float amt = uGrain * mix(0.19, 0.11, uDark) * (1.0 + (1.0 - smoothstep(0.0, 0.7, uReveal)) * 1.3);
  col += (g * 0.6 + mono * 0.8) * amt;
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

const PSF_CSS = `
.psf-root {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  container-type: inline-size;
  container-name: psf;
  background: var(--psf-paper);
  color: var(--psf-ink);
  font-family: var(--psf-sans);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.psf-root *, .psf-root *::before, .psf-root *::after { box-sizing: border-box; }
.psf-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  pointer-events: none;
}
.psf-fallback {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.psf-frame {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: var(--psf-max);
  margin: 0 auto;
  padding: 72px clamp(20px, 5.5cqi, 64px) 0;
}
.psf-top {
  display: flex;
  justify-content: space-between;
  gap: 48px 64px;
}
.psf-brand { max-width: 330px; flex: 0 1 330px; }
.psf-logo {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: var(--psf-ink);
  text-decoration: none;
  font-size: 27px;
  font-weight: 500;
  letter-spacing: -0.035em;
  line-height: 1;
  border-radius: 6px;
}
.psf-mark { width: 27px; height: 24px; flex: none; overflow: visible; }
.psf-mark path {
  fill: var(--psf-ink);
  transform-box: fill-box;
  transform: scaleX(0);
  transition: transform 0.9s cubic-bezier(0.16, 1, 0.3, 1), fill 0.45s ease;
  transition-delay: calc(var(--d) * 1ms);
}
.psf-mark path:nth-child(odd) { transform-origin: 0% 50%; }
.psf-mark path:nth-child(even) { transform-origin: 100% 50%; }
.psf-in .psf-mark path { transform: none; }
.psf-in .psf-logo:hover .psf-mark path { transition-delay: 0ms; }
.psf-in .psf-logo:hover .psf-mark path:nth-child(1) { transform: translateX(3px); fill: var(--psf-c1); }
.psf-in .psf-logo:hover .psf-mark path:nth-child(2) { transform: translateX(-3px); fill: var(--psf-c4); transition-delay: 40ms; }
.psf-in .psf-logo:hover .psf-mark path:nth-child(3) { transform: translateX(3px); fill: var(--psf-c2); transition-delay: 80ms; }
.psf-name { display: inline-flex; white-space: pre; }
.psf-ch {
  display: inline-block;
  opacity: 0;
  transform: translateY(0.55em) rotate(4deg);
  filter: blur(6px);
  transition: opacity 0.7s ease, transform 1s cubic-bezier(0.16, 1, 0.3, 1), filter 0.9s ease;
  transition-delay: calc(var(--d) * 1ms);
}
.psf-in .psf-ch { opacity: 1; transform: none; filter: blur(0); }
.psf-tag {
  margin: 20px 0 0;
  color: var(--psf-muted);
  font-size: 14.5px;
  line-height: 1.5;
  letter-spacing: -0.005em;
}
.psf-socials { display: flex; gap: 8px; margin: 34px 0 0; padding: 0; list-style: none; }
.psf-soc {
  position: relative;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: var(--psf-ink);
  border: 1px solid var(--psf-line);
  border-radius: 9px;
  background: var(--psf-chip);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.35) inset;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.45s ease;
}
.psf-soc::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, var(--psf-c1), var(--psf-c2), var(--psf-c3), var(--psf-c4), var(--psf-c5));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}
.psf-soc svg { width: 16px; height: 16px; transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
.psf-soc:hover, .psf-soc:focus-visible {
  transform: translateY(-3px);
  border-color: transparent;
  box-shadow: 0 10px 22px -12px var(--psf-c1), 0 1px 0 rgba(255, 255, 255, 0.35) inset;
}
.psf-soc:hover::before, .psf-soc:focus-visible::before { opacity: 1; }
.psf-soc:hover svg { transform: scale(1.1) rotate(-6deg); }
.psf-tip {
  position: absolute;
  bottom: calc(100% + 9px);
  left: 50%;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--psf-ink);
  color: var(--psf-paper);
  font-size: 11.5px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, 4px);
  transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.psf-soc:hover .psf-tip, .psf-soc:focus-visible .psf-tip { opacity: 1; transform: translate(-50%, 0); }
.psf-cols {
  display: grid;
  grid-template-columns: repeat(var(--psf-n), auto);
  gap: 40px clamp(28px, 5.6cqi, 88px);
  margin: 0;
}
.psf-col h3 {
  margin: 0 0 22px;
  color: var(--psf-ink);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.015em;
  line-height: 1.2;
}
.psf-col ul { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.psf-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--psf-muted);
  text-decoration: none;
  white-space: nowrap;
  font-size: 14.5px;
  line-height: 1.15;
  letter-spacing: -0.005em;
  border-radius: 4px;
  transition: color 0.3s ease;
}
.psf-roll { position: relative; display: inline-block; overflow: hidden; padding-bottom: 1px; }
.psf-roll > span, .psf-roll::after {
  display: block;
  transition: transform 0.55s cubic-bezier(0.7, 0, 0.2, 1);
}
.psf-roll::after {
  content: attr(data-text);
  position: absolute;
  left: 0;
  top: 0;
  white-space: nowrap;
  transform: translateY(105%);
  background: linear-gradient(90deg, var(--psf-c1), var(--psf-c2) 35%, var(--psf-c4) 70%, var(--psf-c5));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.psf-link:hover, .psf-link:focus-visible { color: var(--psf-ink); }
.psf-link:hover .psf-roll > span, .psf-link:focus-visible .psf-roll > span { transform: translateY(-105%); }
.psf-link:hover .psf-roll::after, .psf-link:focus-visible .psf-roll::after { transform: translateY(0); }
.psf-badge {
  padding: 2px 7px 3px;
  border-radius: 999px;
  border: 1px solid var(--psf-line);
  background: var(--psf-chip);
  color: var(--psf-ink);
  font-size: 10.5px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.01em;
}
.psf-r {
  opacity: 0;
  transform: translateY(14px);
  filter: blur(5px);
  transition: opacity 0.8s cubic-bezier(0.2, 0.7, 0.2, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1), filter 0.9s ease;
  transition-delay: calc(var(--d) * 1ms);
}
.psf-in .psf-r { opacity: 1; transform: none; filter: blur(0); }
.psf-foot { margin-top: 64px; }
.psf-rule {
  position: relative;
  height: 1px;
  overflow: hidden;
  background: var(--psf-line);
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform 1.5s cubic-bezier(0.65, 0, 0.15, 1) 0.95s;
}
.psf-in .psf-rule { transform: none; }
.psf-rule::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 26%;
  background: linear-gradient(90deg, transparent, var(--psf-c1), var(--psf-c2), var(--psf-c4), transparent);
  transform: translateX(-110%);
}
.psf-in .psf-rule::after { animation: psf-glint 2.2s cubic-bezier(0.6, 0, 0.25, 1) 1.9s 1 both; }
.psf-in .psf-foot:hover .psf-rule::after { animation: psf-glint-b 1.8s cubic-bezier(0.6, 0, 0.25, 1) 0s 1 both; }
@keyframes psf-glint { from { transform: translateX(-110%); } to { transform: translateX(400%); } }
@keyframes psf-glint-b { from { transform: translateX(-110%); } to { transform: translateX(400%); } }
.psf-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  flex-wrap: wrap;
  padding: 18px 0 0;
  color: var(--psf-muted);
  font-size: 13px;
  letter-spacing: -0.005em;
}
.psf-bar p { margin: 0; }
.psf-right { display: flex; align-items: center; gap: 14px; }
.psf-credit { display: inline-flex; align-items: center; gap: 5px; }
.psf-credit a {
  color: var(--psf-ink);
  text-decoration: none;
  border-radius: 3px;
  background: linear-gradient(currentColor, currentColor) 0 100% / 100% 1px no-repeat;
  padding-bottom: 1px;
  transition: background-size 0.4s cubic-bezier(0.7, 0, 0.2, 1);
}
.psf-credit a:hover, .psf-credit a:focus-visible {
  background-image: linear-gradient(90deg, var(--psf-c1), var(--psf-c2), var(--psf-c4));
  background-size: 100% 2px;
}
.psf-heart {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  margin: 0 -1px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--psf-heart);
  cursor: pointer;
}
.psf-heart svg { width: 13px; height: 13px; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.psf-heart:hover svg, .psf-heart:focus-visible svg { animation: psf-beat 0.9s ease-in-out infinite; }
.psf-heart:active svg { transform: scale(0.8); }
@keyframes psf-beat {
  0%, 100% { transform: scale(1); }
  14% { transform: scale(1.28); }
  28% { transform: scale(1); }
  42% { transform: scale(1.2); }
  70% { transform: scale(1); }
}
.psf-spark {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  pointer-events: none;
  animation: psf-float 1.1s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}
.psf-spark svg { width: 10px; height: 10px; display: block; }
@keyframes psf-float {
  0% { opacity: 0; transform: translate(0, 0) scale(0.3); }
  18% { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--x), var(--y)) scale(1) rotate(var(--r)); }
}
.psf-up {
  position: relative;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--psf-line);
  border-radius: 50%;
  background: var(--psf-chip);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  color: var(--psf-ink);
  cursor: pointer;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
}
.psf-up svg { width: 13px; height: 13px; }
.psf-up:hover, .psf-up:focus-visible { transform: translateY(-2px); border-color: var(--psf-ink); }
.psf-up:hover svg, .psf-up:focus-visible svg { animation: psf-lift 0.7s cubic-bezier(0.7, 0, 0.2, 1) both; }
@keyframes psf-lift {
  0% { transform: translateY(0); }
  45% { transform: translateY(-160%); }
  46% { transform: translateY(160%); }
  100% { transform: translateY(0); }
}
.psf-stage {
  position: relative;
  z-index: 1;
  flex: 1 0 auto;
  min-height: var(--psf-stage-min);
  margin-top: 28px;
  touch-action: pan-y;
}
.psf-live .psf-stage { cursor: crosshair; }
.psf-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.psf-root a:focus-visible, .psf-root button:focus-visible {
  outline: 2px solid var(--psf-ink);
  outline-offset: 3px;
}
@container psf (max-width: 980px) {
  .psf-top { flex-direction: column; }
  .psf-brand { max-width: 420px; flex: none; }
  .psf-cols { grid-template-columns: repeat(var(--psf-n), minmax(0, 1fr)); }
}
@container psf (max-width: 640px) {
  .psf-frame { padding-top: 52px; }
  .psf-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 36px 24px; }
  .psf-foot { margin-top: 48px; }
  .psf-bar { flex-direction: column; align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  .psf-r, .psf-ch, .psf-rule, .psf-mark path {
    opacity: 1;
    filter: none;
    transform: none;
    transition: none;
  }
  .psf-in .psf-rule::after, .psf-in .psf-foot:hover .psf-rule::after { animation: none; }
  .psf-heart:hover svg, .psf-heart:focus-visible svg, .psf-up:hover svg, .psf-up:focus-visible svg { animation: none; }
  .psf-spark { display: none; }
  .psf-roll > span, .psf-roll::after, .psf-soc, .psf-soc svg, .psf-up { transition: none; }
}
`

type CSSVars = React.CSSProperties

function delay(ms: number): CSSVars {
  return { "--d": ms } as CSSVars
}

/** Three slats folded like a ribbon. They slide apart and take the silk's colours on hover. */
function PrismMark() {
  return (
    <svg className="psf-mark" viewBox="0 0 28 24" aria-hidden="true">
      <path style={delay(60)} d="M6.2 1.5H27L22.8 7.6H2z" />
      <path style={delay(170)} d="M2 9H22.8L27 15.1H6.2z" />
      <path style={delay(280)} d="M6.2 16.5H27L22.8 22.6H2z" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 5.3 3 1.7-1.9 3.2-3 5.3-3 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"
      />
    </svg>
  )
}

function SocialIcon({ icon }: { icon: PrismSilkSocialIcon }) {
  if (icon === "instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
        <circle cx="12" cy="12" r="4.1" />
        <circle cx="17.3" cy="6.7" r="1.05" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (icon === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="3" y="9" width="3.6" height="12" />
        <circle cx="4.8" cy="4.8" r="2.1" />
        <path d="M10 9h3.4v1.7c.6-1 1.9-2 3.9-2 3.3 0 4.3 2.1 4.3 5.3V21h-3.6v-6.2c0-1.5-.3-2.9-2.1-2.9s-2.3 1.3-2.3 2.8V21H10z" />
      </svg>
    )
  }
  if (icon === "youtube") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <rect x="2.6" y="5.2" width="18.8" height="13.6" rx="4" />
        <path d="M10.2 9.4v5.2l4.4-2.6z" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (icon === "github") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.4 9.4 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.1 10.1 0 0 0 22 12.23C22 6.58 17.52 2 12 2z" />
      </svg>
    )
  }
  if (icon === "dribbble") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9.2" />
        <path d="M5.2 5.9c4.4 4 8.4 9.3 10.6 14.6M2.9 10.6c5.4.3 10.9-.8 15-4.2M8.7 20.6c2-4.4 6.4-6.9 12.3-5.8" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.75 3h3.07l-6.71 7.67L22 21h-6.18l-4.84-6.33L5.44 21H2.37l7.18-8.2L2 3h6.33l4.37 5.78L17.75 3zm-1.08 16.2h1.7L7.4 4.73H5.58L16.67 19.2z" />
    </svg>
  )
}

const SPARKS = [
  { x: -18, y: -30, r: -24 },
  { x: -7, y: -40, r: -8 },
  { x: 6, y: -44, r: 10 },
  { x: 17, y: -32, r: 26 },
  { x: -2, y: -26, r: 0 },
]

export default function PrismSilkFooter({
  name = "Lumenfold Labs",
  brandHref = "#",
  logo,
  tagline,
  columns = DEFAULT_COLUMNS,
  socials = DEFAULT_SOCIALS,
  copyright,
  credit = { label: "Makora Studio", href: "#" },
  backToTop = true,
  preset = "auto",
  palette,
  seed = 3,
  speed = 1,
  grain = 0.8,
  grainSize = 2,
  interactive = true,
  maxDpr = 1.5,
  maxWidth = "1180px",
  fontFamily = SANS_STACK,
  height = "760px",
  stageMinHeight = "300px",
  className = "",
}: PrismSilkFooterProps) {
  const rootRef = React.useRef(null as HTMLElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const [inView, setInView] = React.useState(false)
  const [reduced, setReduced] = React.useState(false)
  const [dark, setDark] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const [generation, setGeneration] = React.useState(0)
  const [bursts, setBursts] = React.useState([] as number[])

  // Everything the render loop reads lives in refs, so hover and prop tweaks never restart WebGL.
  const live = React.useRef({ revealAt: -1, columnHue: 0, repaint: () => {} })

  const theme: PrismSilkTheme = preset === "auto" ? (dark ? "nocturne" : "prism") : preset
  const base = PRESETS[theme] || PRESETS.prism
  const colors: PrismSilkPalette = {
    ...base,
    ...(palette || {}),
    silk: psfFive(palette && palette.silk, base.silk),
    dark: palette && typeof palette.dark === "boolean" ? palette.dark : base.dark,
  }
  const colorsRef = React.useRef(colors)
  colorsRef.current = colors
  const tune = React.useRef({ seed, speed, grain, grainSize })
  tune.current = { seed, speed, grain, grainSize }

  // ---- reduced motion & theme --------------------------------------------------
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const sync = () => setDark(!!(root.parentElement && root.parentElement.closest(".dark")))
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ["class"] })
    return () => mo.disconnect()
  }, [])

  // ---- the reveal fires once, when a fifth of the footer is on screen --------------
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || inView) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          live.current.revealAt = performance.now()
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(root)
    return () => io.disconnect()
  }, [inView])

  // A colour change repaints even when the loop is asleep (reduced motion).
  const colorKey = JSON.stringify(colors)
  React.useEffect(() => {
    live.current.repaint()
  }, [colorKey, seed, grain, grainSize])

  // ---- the silk ------------------------------------------------------------------
  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!root || !canvas || !stage) return

    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, premultipliedAlpha: false })
    if (!gl) {
      setFailed(true)
      return
    }
    const compile = (type: number, text: string) => {
      const s = gl.createShader(type)
      if (!s) return null
      gl.shaderSource(s, text)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) {
        gl.deleteShader(s)
        return null
      }
      return s
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    const program = vs && fs ? gl.createProgram() : null
    if (!program || !vs || !fs) {
      setFailed(true)
      return
    }
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
      gl.deleteProgram(program)
      setFailed(true)
      return
    }
    const vao = gl.createVertexArray()
    const loc = (n: string) => gl.getUniformLocation(program, n)
    const U = {
      res: loc("uRes"),
      stageH: loc("uStageH"),
      time: loc("uTime"),
      reveal: loc("uReveal"),
      layers: loc("uLayers"),
      paperTop: loc("uPaperTop"),
      paperLow: loc("uPaperLow"),
      glow: loc("uGlow"),
      c: loc("uC"),
      hue: loc("uHue"),
      ptr: loc("uPtr"),
      rip: loc("uRip"),
      grain: loc("uGrain"),
      grainPx: loc("uGrainPx"),
      frame: loc("uFrame"),
      dark: loc("uDark"),
      seed: loc("uSeed"),
    }

    // ---- sizing, from the element rather than the window ------------------------
    let dpr = 1
    let stageCss = 300
    const measure = () => {
      dpr = Math.min(window.devicePixelRatio || 1, Math.max(maxDpr, 0.5))
      const w = Math.max(Math.floor(canvas.clientWidth * dpr), 1)
      const h = Math.max(Math.floor(canvas.clientHeight * dpr), 1)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      const rr = root.getBoundingClientRect()
      const sr = stage.getBoundingClientRect()
      stageCss = psfStageHeight(rr.height, sr.top - rr.top)
    }

    // ---- pointer ---------------------------------------------------------------
    const ptr = { x: 1.5, y: 0.6, s: 0, tx: 1.5, ty: 0.6, ts: 0 }
    let tilt = 0
    let tiltTarget = 0
    let hue = 0
    const ripples: { x: number; born: number }[] = []

    const toStage = (e: PointerEvent) => {
      const r = root.getBoundingClientRect()
      return {
        x: (e.clientX - r.left) / stageCss,
        y: (r.bottom - e.clientY) / stageCss,
        fx: (e.clientX - r.left) / Math.max(r.width, 1),
      }
    }
    const onMove = (e: PointerEvent) => {
      if (!interactive) return
      const p = toStage(e)
      ptr.tx = p.x
      ptr.ty = p.y
      ptr.ts = p.y < 1.25 ? 1 : 0
      tiltTarget = (p.fx - 0.5) * 0.16
      wake()
    }
    const onLeave = () => {
      ptr.ts = 0
      tiltTarget = 0
      wake()
    }
    const onDown = (e: PointerEvent) => {
      if (!interactive || e.button > 0) return
      if ((e.target as HTMLElement | null)?.closest("a,button,input,textarea,select,label")) return
      const p = toStage(e)
      if (p.y > 1.15) return
      ptr.tx = p.x
      ptr.ty = p.y
      ptr.ts = 1
      if (reduced) return
      ripples.push({ x: p.x, born: performance.now() })
      if (ripples.length > 4) ripples.shift()
      wake()
    }

    // ---- one frame ---------------------------------------------------------------
    const t0 = performance.now()
    let last = t0
    let clock = 7 + (tune.current.seed % 5)
    const layers = new Float32Array(5)
    const silk = new Float32Array(15)
    const rip = new Float32Array(16)

    const paint = () => {
      if (gl.isContextLost()) return
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const T = tune.current
      const C = colorsRef.current
      clock += reduced ? 0 : dt * T.speed

      const at = live.current.revealAt
      const reveal = reduced ? 1 : at < 0 ? 0 : psfClamp((now - at) / REVEAL_MS, 0, 1)
      for (let i = 0; i < 5; i++) layers[i] = reduced ? 1 : psfLayerRise(reveal, i, 5)

      const k = reduced ? 1e3 : 1
      ptr.x = psfApproach(ptr.x, ptr.tx, dt * k, 6)
      ptr.y = psfApproach(ptr.y, ptr.ty, dt * k, 6)
      ptr.s = psfApproach(ptr.s, reduced ? 0 : ptr.ts, dt, 2.6)
      tilt = psfApproach(tilt, tiltTarget, dt * k, 2.2)
      hue = psfApproach(hue, live.current.columnHue, dt * k, 2.4)

      rip.fill(0)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const age = (now - ripples[i].born) / 1000
        if (age > 4) ripples.splice(i, 1)
      }
      ripples.forEach((r, i) => rip.set([r.x, (now - r.born) / 1000, 1, 0], i * 4))

      C.silk.forEach((c, i) => silk.set(psfHex(c) || [0.5, 0.5, 0.5], i * 3))
      const hx = (c: string, f: string) => psfHex(c) || psfHex(f) || [1, 1, 1]

      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(U.res, canvas.width, canvas.height)
      gl.uniform1f(U.stageH, stageCss * (canvas.width / Math.max(canvas.clientWidth, 1)))
      gl.uniform1f(U.time, clock)
      gl.uniform1f(U.reveal, reveal)
      gl.uniform1fv(U.layers, layers)
      gl.uniform3fv(U.paperTop, hx(C.paperTop, base.paperTop))
      gl.uniform3fv(U.paperLow, hx(C.paperLow, base.paperLow))
      gl.uniform3fv(U.glow, hx(C.glow, base.glow))
      gl.uniform3fv(U.c, silk)
      gl.uniform1f(U.hue, hue + tilt)
      gl.uniform3f(U.ptr, ptr.x, ptr.y, ptr.s)
      gl.uniform4fv(U.rip, rip)
      gl.uniform1f(U.grain, psfClamp(T.grain, 0, 1.5))
      gl.uniform1f(U.grainPx, Math.max(Math.round(T.grainSize * dpr), 1))
      gl.uniform1f(U.frame, reduced ? 1 : psfGrainFrame((now - t0) / 1000, 24))
      gl.uniform1f(U.dark, C.dark ? 1 : 0)
      gl.uniform1f(U.seed, T.seed)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    // ---- loop, asleep whenever nobody can see it ---------------------------------------
    let raf = 0
    let visible = true
    const frame = () => {
      raf = 0
      paint()
      if (!reduced && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }
    function wake() {
      if (reduced) {
        paint()
        return
      }
      if (!raf && visible && !document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    live.current.repaint = wake

    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting)
      wake()
    })
    io.observe(root)
    document.addEventListener("visibilitychange", wake)
    const ro = new ResizeObserver(() => {
      measure()
      paint()
    })
    ro.observe(root)
    ro.observe(stage)

    const onLost = (e: Event) => {
      e.preventDefault()
      cancelAnimationFrame(raf)
      raf = 0
    }
    const onRestored = () => setGeneration((g) => g + 1)
    canvas.addEventListener("webglcontextlost", onLost)
    canvas.addEventListener("webglcontextrestored", onRestored)

    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerdown", onDown)
    root.addEventListener("pointerleave", onLeave)
    root.addEventListener("pointercancel", onLeave)

    measure()
    paint()
    wake()

    return () => {
      cancelAnimationFrame(raf)
      live.current.repaint = () => {}
      io.disconnect()
      ro.disconnect()
      document.removeEventListener("visibilitychange", wake)
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", onRestored)
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerdown", onDown)
      root.removeEventListener("pointerleave", onLeave)
      root.removeEventListener("pointercancel", onLeave)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, generation, interactive, maxDpr])

  // ---- column tints ------------------------------------------------------------------
  const tint = (ci: number) => () => {
    if (!interactive) return
    live.current.columnHue = psfColumnHue(ci, columns.length)
    live.current.repaint()
  }
  const untint = () => {
    live.current.columnHue = 0
    live.current.repaint()
  }

  const burst = () => {
    if (reduced) return
    const id = performance.now()
    setBursts((b) => b.slice(-2).concat(id))
    window.setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 1200)
  }

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })
  }

  const year = new Date().getFullYear()
  const line = copyright ?? "© " + year + " " + name + ", Inc. All rights reserved."
  const brandLetters = Array.from(name)
  const c = colors.silk

  return (
    <footer
      ref={rootRef}
      className={"psf-root" + (inView ? " psf-in" : "") + (interactive ? " psf-live" : "") + (className ? " " + className : "")}
      style={
        {
          minHeight: height,
          "--psf-paper": colors.paperTop,
          "--psf-ink": colors.ink,
          "--psf-muted": colors.muted,
          "--psf-line": colors.line,
          "--psf-chip": colors.chip,
          "--psf-heart": colors.heart,
          "--psf-c1": c[0],
          "--psf-c2": c[1],
          "--psf-c3": c[2],
          "--psf-c4": c[3],
          "--psf-c5": c[4],
          "--psf-n": columns.length,
          "--psf-max": maxWidth,
          "--psf-sans": fontFamily,
          "--psf-stage-min": stageMinHeight,
        } as CSSVars
      }
    >
      <style>{PSF_CSS}</style>
      {failed ? (
        <div
          className="psf-fallback"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(55% 42% at 28% 100%, " + c[0] + " 0%, transparent 70%)," +
              "radial-gradient(48% 36% at 78% 96%, " + c[3] + " 0%, transparent 72%)," +
              "radial-gradient(70% 30% at 52% 104%, " + c[1] + " 0%, transparent 70%)," +
              "radial-gradient(60% 34% at 45% 78%, " + c[4] + " 0%, transparent 70%)," +
              "linear-gradient(180deg, " + colors.paperTop + " 30%, " + colors.paperLow + ")",
          }}
        />
      ) : (
        <canvas ref={canvasRef} className="psf-canvas" aria-hidden="true" />
      )}

      <div className="psf-frame">
        <div className="psf-top">
          <div className="psf-brand">
            <a className="psf-logo" href={brandHref} aria-label={name}>
              {logo ?? <PrismMark />}
              <span className="psf-name" aria-hidden="true">
                {brandLetters.map((ch, i) => (
                  <span key={i} className="psf-ch" style={delay(180 + i * 32)}>
                    {ch}
                  </span>
                ))}
              </span>
            </a>
            {tagline !== "" ? (
              <p className="psf-tag psf-r" style={delay(480)}>
                {tagline ?? "Join thousands of companies already using " + name + " to simplify their workflow."}
              </p>
            ) : null}
            {socials.length ? (
              <ul className="psf-socials">
                {socials.map((s, i) => {
                  const label = s.label || SOCIAL_NAMES[s.icon]
                  return (
                    <li key={s.icon + i} className="psf-r" style={delay(600 + i * 70)}>
                      <a className="psf-soc" href={s.href || "#"} aria-label={label}>
                        <SocialIcon icon={s.icon} />
                        <span className="psf-tip" aria-hidden="true">
                          {label}
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>

          <nav className="psf-cols" aria-label="Footer">
            {columns.map((col, ci) => (
              <div
                className="psf-col"
                key={col.title + ci}
                onPointerEnter={tint(ci)}
                onPointerLeave={untint}
                onFocus={tint(ci)}
                onBlur={untint}
              >
                <h3 className="psf-r" style={delay(360 + ci * 95)} id={"psf-col-" + ci}>
                  {col.title}
                </h3>
                <ul aria-labelledby={"psf-col-" + ci}>
                  {col.links.map((l, li) => (
                    <li key={l.label + li} className="psf-r" style={delay(440 + ci * 95 + li * 48)}>
                      <a className="psf-link" href={l.href || "#"}>
                        <span className="psf-roll" data-text={l.label}>
                          <span>{l.label}</span>
                        </span>
                        {l.badge ? <span className="psf-badge">{l.badge}</span> : null}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="psf-foot">
          <div className="psf-rule" aria-hidden="true" />
          <div className="psf-bar">
            <p className="psf-r" style={delay(1350)}>
              {line}
            </p>
            <div className="psf-right psf-r" style={delay(1450)}>
              {credit ? (
                <span className="psf-credit">
                  Made with
                  <button type="button" className="psf-heart" onClick={burst} aria-label="Send some love">
                    <HeartIcon />
                    {bursts.map((id) => (
                      <React.Fragment key={id}>
                        {SPARKS.map((s, si) => (
                          <span
                            key={si}
                            className="psf-spark"
                            style={
                              {
                                "--x": s.x + "px",
                                "--y": s.y + "px",
                                "--r": s.r + "deg",
                                animationDelay: si * 45 + "ms",
                                color: c[si % 5],
                              } as CSSVars
                            }
                          >
                            <HeartIcon />
                          </span>
                        ))}
                      </React.Fragment>
                    ))}
                  </button>
                  by
                  {credit.href ? <a href={credit.href}>{credit.label}</a> : <span>{credit.label}</span>}
                </span>
              ) : null}
              {backToTop ? (
                <button type="button" className="psf-up" onClick={toTop} aria-label="Back to top">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div ref={stageRef} className="psf-stage" aria-hidden="true" />
    </footer>
  )
}

// Declared after the JSX: the 21st CLI tokenizer hangs on mapped types before it.
type PrismSilkPresetMap = { [K in PrismSilkTheme]: PrismSilkPalette }
type PrismSilkSocialNameMap = { [K in PrismSilkSocialIcon]: string }
