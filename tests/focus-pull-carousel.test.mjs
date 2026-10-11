// Install-safety and logic checks for components/focus-pull-carousel.
// Run: node tests/focus-pull-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "focus-pull-carousel"
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
  const css = src.match(/const FP_CSS = \[([\s\S]*?)\]\.join/)[1]
  assert.doesNotMatch(css, /$\{|`|(^|[\s"}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /-root\{[^}]*width:100%/, "the root claims full width")
  assert.match(css, /max-width:none/, "images are guarded against Preflight")
}
{
  const demo = read("demo.tsx")
  assert.match(demo, /from "@\/components\/ui\/focus-pull-carousel"/)
  assert.doesNotMatch(demo, /https?:\/\//, "the primary demo is self-contained, so 21st can capture it")
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

const c = L.focusOf(0, 7)
assert.deepEqual([c.scale, c.blur, c.opacity, c.saturate], [1, 0, 1, 1], "the centre card is untouched")
let prev = c
for (const d of [0.25, 0.5, 0.75, 1, 1.5, 2, 4]) {
  const f = L.focusOf(d, 7)
  assert.deepEqual(f, L.focusOf(-d, 7), "symmetric left and right")
  assert.ok(f.scale <= prev.scale && f.opacity <= prev.opacity && f.blur >= prev.blur, "focus falls off monotonically")
  assert.ok(f.scale > 0.8 && f.opacity >= 0.5 && f.blur <= 14, "neighbours stay legible")
  prev = f
}
assert.equal(L.focusOf(3, 0).blur, 0, "blur 0 turns the pull off")
assert.equal(L.nearestIndex([100, 300, 500], 290), 1)
assert.equal(L.nearestIndex([100, 300, 500], -50), 0)
assert.equal(L.nearestIndex([100, 300, 500], 9e9), 2)
assert.match(src, /scroll-snap-type:x mandatory/, "built on native scroll snapping")
console.log("focus-pull-carousel: ok")
