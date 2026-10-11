// Install-safety and logic checks for components/aperture-carousel.
// Run: node tests/aperture-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "aperture-carousel"
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
  const css = src.match(/const AP_CSS = \[([\s\S]*?)\]\.join/)[1]
  assert.doesNotMatch(css, /$\{|`|(^|[\s"}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /-root\{[^}]*width:100%/, "the root claims full width")
  assert.match(css, /max-width:none/, "images are guarded against Preflight")
}
{
  const demo = read("demo.tsx")
  assert.match(demo, /from "@\/components\/ui\/aperture-carousel"/)
  assert.doesNotMatch(demo, /https?:\/\//, "the primary demo is self-contained, so 21st can capture it")
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

for (const [w, h] of [[1600, 1000], [390, 844]]) {
  for (const [x, y] of [[0, 0], [w, h], [w / 2, h / 2], [w * 0.85, h * 0.5], [10, h - 3]]) {
    const R = L.coverRadius(x, y, w, h)
    for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h]]) assert.ok(Math.hypot(cx - x, cy - y) <= R + 1e-9, "the iris always ends past every corner")
  }
}
assert.equal(L.coverRadius(0, 0, 3, 4), 5)
assert.equal(L.sideOf(800, 1600), 1)
assert.equal(L.sideOf(799, 1600), -1)
assert.equal(L.wrap(-1, 6), 5)
assert.equal(L.wrap(6, 6), 0)
assert.equal(L.wrap(3, 0), 0)
assert.equal(L.pad2(3), "03")
assert.equal(L.pad2(12), "12")
assert.match(src, /onAnimationEnd=\{\(\) => go\(1\)\}/, "the progress line drives autoplay")
assert.match(src, /animation-play-state:paused/, "the timer pauses off-screen")
console.log("aperture-carousel: ok")
