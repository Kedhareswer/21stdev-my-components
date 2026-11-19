// Install-safety and track check for components/featured-cities-carousel.
// Run: node tests/featured-cities-carousel.test.mjs
//
// Source assertions first (the rules that only fail once installed), then the
// "// #region track" block is lifted out and run: arrows and keys move exactly
// one card, never past either end, from any scroll offset.
import assert from "node:assert/strict"
import { readFileSync, statSync } from "node:fs"

const src = readFileSync(new URL("../components/featured-cities-carousel/featured-cities-carousel.tsx", import.meta.url), "utf8")
const demo = readFileSync(new URL("../components/featured-cities-carousel/demo.tsx", import.meta.url), "utf8")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
assert.match(src, /height = "680px"/, "root height must default to a definite length")
assert.match(src, /\n\s+height,\n\s+width: "100%",/, "root carries the height prop")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /`/, "no backticks in the file")
assert.doesNotMatch(src, /\$\{/, "no ${ in the file")
assert.doesNotMatch(src, /useRef</, "no useRef generics")
assert.doesNotMatch(src, /(^|[{}"])\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.ok(Buffer.byteLength(src) < 200 * 1024, "21st rejects component files over 200 kB")
assert.match(demo, /from "@\/components\/ui\/featured-cities-carousel"/, "demo imports the installed path")
assert.doesNotMatch(demo + src, /sketch-city-hero/, "independent of the hero")
assert.ok(tsconfig.includes('"@/components/ui/featured-cities-carousel"'), "tsconfig needs its paths line")
assert.ok(!/var\(--color-/.test(src), "assumes no theme tokens")

assert.ok(src.includes(".fcc-root img{max-width:none"), "CSS guard against img max-width:100%")
assert.ok(src.includes('maxWidth: "none"') && src.includes("width={size.w}") && src.includes("height={Math.round(picH)}"), "drawings carry explicit size")
assert.doesNotMatch(src, /scale\((?!\.94\))/, "no enlarging transform: scale (only the arrow press shrinks)")

// Pictures from the catalog site, present locally.
assert.ok(src.includes('"https://kedhar-components.pages.dev/featured-cities-carousel/"'), "image base is the catalog")
const hosts = new Set((src.match(/https:\/\/[a-z0-9.-]+/gi) || []).map((u) => u.toLowerCase()))
for (const h of hosts) assert.ok(["https://kedhar-components.pages.dev", "https://fonts.googleapis.com"].includes(h), "unexpected host " + h)
const names = ["amsterdam", "new-orleans", "prague", "lisbon", "kyoto", "mexico-city", "istanbul", "marrakech", "havana"]
for (const n of names) {
  assert.ok(src.includes('image: "' + n + '"'), "card for " + n)
  assert.ok(statSync(new URL("../dev/public/featured-cities-carousel/" + n + ".webp", import.meta.url)).size > 5000, n + ".webp present")
}

// No reference identifiers or its copy.
for (const banned of [/dorsia/i, /stag-night/i, /bozos/i, /fantasyland/i, /potholes/i, /flip-flops/i, /cradle-robber/i, /framer/i]) {
  assert.doesNotMatch(src, banned, "no reference copy: " + banned)
}
assert.ok(src.includes("Kedhareswer"), "subtitle is about Kedhareswer")

// Interaction and motion guards.
assert.ok(src.includes("scroll-snap-type:x mandatory") && src.includes("scroll-snap-align:start"), "native snap for touch")
assert.ok(src.includes('e.pointerType !== "mouse"'), "drag is mouse-only; touch scrolls natively")
assert.ok(src.includes('track.addEventListener("click", onClick, true)'), "a drag never follows a link")
assert.ok(src.includes('e.key === "ArrowRight" || e.key === "ArrowLeft"') && src.includes('e.key === "Home" || e.key === "End"'), "keyboard")
assert.ok(src.includes("disabled={edge.start}") && src.includes("disabled={edge.end}"), "arrows disable at the ends")
assert.ok(src.includes('aria-live="polite"'), "announces the current city")
assert.ok(src.includes("@media (prefers-reduced-motion:reduce)") && src.includes('prefersReduced() ? "auto" : "smooth"'), "reduced motion")
// entrance transform on the wrapper, hover transform on the card inside (fill:both would override)
assert.ok(src.includes('className="fcc-in"') && src.includes(".fcc-card:hover{transform:translateY(-8px)"), "entrance and hover on separate elements")
assert.ok(src.includes(".fcc-card:hover .fcc-draw{transform:translateY(-6px)}"), "drawing rises on hover, never sinks below the card edge")
assert.ok(src.includes("padding:14px var(--fcc-gutter) 36px;margin-bottom:-18px;"), "room for the lift and its shadow inside the scroller")
assert.doesNotMatch(src, /fcc-track::after/, "the end gutter is the scroller's own padding")

// --- the track model, executed -------------------------------------------
const start = src.indexOf("// #region track")
const end = src.indexOf("// #endregion track")
assert.ok(start > 0 && end > start, "track region present")
const body = src.slice(start, end).replace(/export /g, "").replace(/: number/g, "")
const m = new Function(body + "\nreturn { cardSize, cardIndexAt, scrollFor, stepTo }")()

assert.deepEqual(m.cardSize(1440), { w: 300, gap: 20, pitch: 320 })
assert.deepEqual(m.cardSize(1024), { w: 268, gap: 20, pitch: 288 })
assert.equal(m.cardSize(390).w, 289)
assert.equal(m.cardSize(390).gap, 14)

const pitch = 320, count = 9, max = 8 * pitch - 900 // a typical scroll range
// From a snapped card, next/prev move exactly one.
for (let i = 0; i < count; i++) {
  const left = Math.min(i * pitch, max)
  const n = m.stepTo(left, 1, pitch, count, max)
  if (left < max - 2) assert.equal(m.scrollFor(n, pitch, max), Math.min((m.cardIndexAt(left, pitch, count) + 1) * pitch, max), "next from card " + i)
}
// From part-way between cards, next goes to the following card, prev to the previous one.
assert.equal(m.stepTo(1.4 * pitch, 1, pitch, count, max), 2)
assert.equal(m.stepTo(1.4 * pitch, -1, pitch, count, max), 1)
assert.equal(m.stepTo(0, -1, pitch, count, max), 0, "never before the first")
assert.equal(m.stepTo(max, 1, pitch, count, max), m.cardIndexAt(max, pitch, count), "never past the end")
assert.equal(m.scrollFor(99, pitch, max), max, "clamped to the scroll range")
assert.equal(m.scrollFor(-3, pitch, max), 0)

console.log("featured-cities-carousel: ok")
