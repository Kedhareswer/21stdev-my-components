// Install-safety and logic checks for components/polaroid-line-carousel.
// Run: node tests/polaroid-line-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "polaroid-line-carousel"
const read = (f) => readFileSync(new URL(`../components/${SLUG}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|https?:\/\//, "nothing loads at runtime — default images are painted")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /height = "100svh"/, "explicit default height")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /@@PAINTER@@/, "the painter was spliced in")
assert.match(src, /prefers-reduced-motion/, "reduced motion is honoured")
assert.match(src, /aria-roledescription="carousel"/, "announced as a carousel")
assert.match(src, /aria-live="polite"/, "slide changes are announced")
assert.match(src, /ArrowRight[\s\S]*ArrowLeft/, "arrow keys move between slides")
assert.match(src, /IntersectionObserver/, "autoplay sleeps off-screen")
{
  const css = src.match(/const PL_CSS = \[([\s\S]*?)\]\.join/)[1]
  assert.doesNotMatch(css, /$\{|`|(^|[\s"}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /-root\{[^}]*width:100%/, "the root claims full width")
  assert.match(css, /max-width:none/, "images are guarded against Preflight")
}
{
  const demo = read("demo.tsx")
  assert.match(demo, /from "@\/components\/ui\/polaroid-line-carousel"/)
  assert.doesNotMatch(demo, /https?:\/\//, "the primary demo is self-contained, so 21st can capture it")
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

assert.equal(L.stringY(0, 1000, 100, 40), 100, "the string is tied at both ends")
assert.equal(L.stringY(1000, 1000, 100, 40), 100)
assert.equal(L.stringY(500, 1000, 100, 40), 140, "sags by `sag` in the middle")
{
  let x = 0, v = 0
  for (let i = 0; i < 120; i++) [x, v] = L.springStep(x, v, 300, 1 / 60)
  assert.ok(Math.abs(x - 300) < 1 && Math.abs(v) < 5, "the line settles on its target within 2s")
}
{
  let a = 0, w = 0
  for (let i = 0; i < 30; i++) [a, w] = L.swingStep(a, w, 900, 1 / 60, 1)
  assert.ok(a > 0, "moving right, a print lags (swings clockwise)")
  for (let i = 0; i < 300; i++) [a, w] = L.swingStep(a, w, 0, 1 / 60, 1)
  assert.ok(Math.abs(a) < 0.005, "and settles once the line stops")
  let b = 0, bw = 0
  for (let i = 0; i < 60; i++) [b, bw] = L.swingStep(b, bw, 99999, 1 / 60, 1)
  assert.ok(Math.abs(b) <= 0.6, "never swings past the clamp")
  assert.deepEqual(L.swingStep(0, 0, 900, 1 / 60, 0), [0, 0], "swing 0 holds the prints still")
}
assert.equal(L.nearestAt(-500, 300, 6), 0)
assert.equal(L.nearestAt(760, 300, 6), 3)
assert.equal(L.nearestAt(1e6, 300, 6), 5)
console.log("polaroid-line-carousel: ok")
