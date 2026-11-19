// Install-safety and layout check for components/sketch-city-hero.
// Run: node tests/sketch-city-hero.test.mjs
//
// The first half is source assertions: the rules that only fail once the file
// is installed somewhere else. The second half lifts the "// #region layout"
// block out of the component and runs it: the drawing must never sit under the
// copy, must bleed off the right and bottom, and the layers must never move
// apart further than the skyline is painted under the streets.
import assert from "node:assert/strict"
import { readFileSync, statSync } from "node:fs"

const src = readFileSync(new URL("../components/sketch-city-hero/sketch-city-hero.tsx", import.meta.url), "utf8")
const demo = readFileSync(new URL("../components/sketch-city-hero/demo.tsx", import.meta.url), "utf8")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
assert.match(src, /height = "100svh"/, "root height must default to a definite length")
assert.match(src, /\{ height, width: "100%"/, "root carries the height prop")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse once installed")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /`/, "no backticks in the file")
assert.doesNotMatch(src, /\$\{/, "no ${ in the file")
assert.doesNotMatch(src, /useRef</, "no useRef generics")
assert.doesNotMatch(src, /(^|[{}"])\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.ok(Buffer.byteLength(src) < 200 * 1024, "21st rejects component files over 200 kB")
assert.match(demo, /from "@\/components\/ui\/sketch-city-hero"/, "demo imports the installed path")
assert.doesNotMatch(demo, /featured-cities-carousel/, "independent of the carousel")
assert.doesNotMatch(src, /featured-cities-carousel/, "independent of the carousel")
assert.ok(tsconfig.includes('"@/components/ui/sketch-city-hero"'), "tsconfig needs its paths line")
assert.ok(!/var\(--color-/.test(src), "assumes no theme tokens: paper and ink are its own")

// Preflight guards: the drawing is laid out at its on-screen size.
assert.ok(src.includes(".sch-root img{max-width:none"), "CSS guard against img max-width:100%")
assert.ok(src.includes('maxWidth: "none"'), "inline guard on the drawing")
assert.ok(src.includes("width={Math.round(box.w)}") && src.includes("height={Math.round(box.h)}"), "drawing carries explicit width/height")
assert.doesNotMatch(src, /scale\(/, "nothing is enlarged with transform: scale")

// Pictures come from the catalog site and exist locally.
assert.ok(src.includes('"https://kedhar-components.pages.dev/sketch-city-hero/"'), "image base is the catalog")
const hosts = new Set((src.match(/https:\/\/[a-z0-9.-]+/gi) || []).map((u) => u.toLowerCase()))
for (const h of hosts) assert.ok(["https://kedhar-components.pages.dev", "https://fonts.googleapis.com"].includes(h), "unexpected host " + h)
for (const n of ["skyline", "streets"]) {
  assert.ok(src.includes('"' + n + '.webp"'), "uses " + n)
  assert.ok(statSync(new URL("../dev/public/sketch-city-hero/" + n + ".webp", import.meta.url)).size > 5000, n + ".webp present")
}

// No identifiers from the reference; copy about Kedhareswer.
for (const banned of [/dorsia/i, /untourist/i, /pinky swear/i, /the corner/i, /framer/i]) assert.doesNotMatch(src, banned, "no reference identifiers: " + banned)
assert.ok(src.includes("Kedhareswer") && src.includes("Kedhar's Atlas"), "copy is about Kedhareswer")

// Motion: reduced motion, pausing, eased inputs, ordering.
assert.ok(src.includes("prefers-reduced-motion: reduce"), "JS checks reduced motion")
assert.ok(src.includes("@media (prefers-reduced-motion:reduce)"), "CSS honours reduced motion")
assert.ok(src.includes("new IntersectionObserver") && src.includes("document.hidden"), "parallax pauses offscreen and hidden")
assert.ok(src.includes("const ease = 1 - Math.pow(1 - 0.075, dt / 16.67)"), "pointer and scroll are eased, frame-rate independent")
assert.ok(src.includes(".sch-ink img{animation:sch-ink 1.7s cubic-bezier(.45,.05,.25,1) .1s both}"), "streets ink in first")
assert.ok(src.includes(".sch-sky img{animation:sch-ink 1.7s cubic-bezier(.45,.05,.25,1) .85s both}"), "mint trails the streets, hiding its under-fill")
assert.ok(src.includes(".sch-layer img{-webkit-mask-image"), "both layers are masked during the wipe")
assert.ok(src.includes('.sch-root:not([data-ready=true]) .sch-word'), "headline waits for the web fonts")
assert.ok(src.includes('document.fonts.load("600 64px \'Bricolage Grotesque\'")'), "waits for the actual faces, not fonts.ready alone")
assert.ok(src.includes("artReady && box.w > 0"), "drawing is placed once, after the fonts")
// parallax transforms go on wrappers; CSS animations sit on the imgs inside (fill:both would override)
assert.ok(src.includes("skyRef.current.style.transform") && src.includes('ref={skyRef} className="sch-layer sch-sky"'), "parallax drives the wrapper")
assert.ok(src.includes(".sch-ghost{visibility:hidden}") && src.includes(".sch-val{justify-self:start}"), "count-up never reflows the line or the gutter")
assert.ok(src.includes('if (e.key === "Escape") setOpen("")'), "Escape closes the panels")

// --- the layout, executed -------------------------------------------------
const start = src.indexOf("// #region layout")
const end = src.indexOf("// #endregion layout")
assert.ok(start > 0 && end > start, "layout region present")
const body = src
  .slice(start, end)
  .replace(/export interface \w+ \{[^}]*\}/g, "")
  .replace(/export /g, "")
  .replace(/: (number|boolean|Rect\[\])/g, "")
const m = new Function(body + "\nreturn { ART_W, ART_H, SKY, artBox, clearOfText, countAt, layerOffsets, STACK_BELOW }")()

assert.equal(m.SKY.length, 48)
assert.ok(m.SKY.every((v) => v >= 0 && v <= m.ART_H), "skyline values are drawing rows")

// Copy blocks roughly as laid out at 1440 x 900 (stage 1440 x 820, gutter 130).
const copyAt = (g, top, scale) => [
  { l: g, t: top, r: g + 620 * scale, b: top + 80 * scale },
  { l: g, t: top + 86 * scale, r: g + 560 * scale, b: top + 166 * scale },
  { l: g, t: top + 200 * scale, r: g + 320 * scale, b: top + 228 * scale },
  { l: g, t: top + 232 * scale, r: g + 530 * scale, b: top + 262 * scale },
  { l: g, t: top + 266 * scale, r: g + 485 * scale, b: top + 296 * scale },
]
for (const [W, H, g, scale] of [[1440, 820, 130, 1], [1280, 640, 77, 0.85], [1920, 1000, 370, 1.1], [1024, 688, 61, 0.8], [1536, 696, 178, 0.92]]) {
  const text = copyAt(g, Math.min(110, H * 0.11), scale)
  const b = m.artBox(W, H, false, text, 16)
  assert.ok(m.clearOfText(b.x, b.y, b.s, text, 16), W + "x" + H + ": copy stays in open sky")
  assert.ok(b.x + b.w >= W - 0.5, W + "x" + H + ": drawing reaches the right edge")
  assert.ok(Math.abs(b.y + b.h - H) < 0.5, W + "x" + H + ": drawing sits on the bottom edge")
  assert.ok(b.y >= -0.05 * b.h - 0.5, W + "x" + H + ": at most a sliver of the spire is cropped")
  assert.ok(b.w >= W * 0.5, W + "x" + H + ": the drawing still covers at least half the width (" + Math.round(b.w) + ")")
}
// With no copy in the way, it takes the largest scale the spire crop allows, unbled.
const free = m.artBox(1440, 820, false, [], 16)
assert.ok(free.s >= Math.min((820 * 1.04) / 1024, (1440 * 1.12) / 1536) - 0.0051, "no copy: largest allowed scale")
assert.ok(Math.abs(free.x + free.w - 1440) < 0.5, "no copy: no extra bleed")
// A copy block that runs across the skyline forces the drawing smaller or further right.
const wide = [{ l: 0, t: 0, r: 1440, b: 500 }]
const shy = m.artBox(1440, 820, false, wide, 16)
assert.ok(m.clearOfText(shy.x, shy.y, shy.s, wide, 16) || shy.s <= (820 * 0.42) / 1024 + 1e-9, "falls back to the smallest scale when nothing fits")

// Stacked: fills the height, spires included, never leaves a gap at the left.
const st = m.artBox(390, 520, true)
assert.ok(Math.abs(st.h - 520 / 0.97) < 0.5 && st.y < 0 && st.y > -0.04 * st.h, "stacked: full height, spires in")
assert.ok(st.x <= 0 && st.x + st.w >= 390, "stacked: covers the stage width")

// Count-up: starts at 0, ends exactly on the target, monotonic.
assert.equal(m.countAt(5312, 0), 0)
assert.equal(m.countAt(5312, 1), 5312)
assert.equal(m.countAt(5312, 4), 5312)
let prev = -1
for (let t = 0; t <= 1; t += 0.05) { const v = m.countAt(5312, t); assert.ok(v >= prev, "monotonic"); prev = v }

// Layers never separate further than the 14 drawing-px under-fill (13 used, at any scale).
for (const s of [0.5, 0.66, 0.9, 1, 1.2]) {
  let worst = 0
  for (const px of [-1, 1]) for (const py of [-1, 1]) for (const sc of [0, 1]) for (const t of [0, 3456, 6900]) {
    const o = m.layerOffsets(px, py, sc, t, s)
    worst = Math.max(worst, Math.hypot(o.sky.x - o.street.x, o.sky.y - o.street.y))
  }
  assert.ok(worst <= 13 * s + 1e-9 || worst <= 13 * Math.min(s, 1) + 1e-9, "separation " + worst.toFixed(2) + " px at scale " + s)
}

console.log("sketch-city-hero: ok")
