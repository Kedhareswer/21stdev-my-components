// Install-safety and logic checks for components/tile-flip-carousel.
// Run: node tests/tile-flip-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "tile-flip-carousel"
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
  const css = src.match(/const TF_CSS = \[([\s\S]*?)\]\.join/)[1]
  assert.doesNotMatch(css, /$\{|`|(^|[\s"}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /-root\{[^}]*width:100%/, "the root claims full width")
  assert.match(css, /max-width:none/, "images are guarded against Preflight")
}
{
  const demo = read("demo.tsx")
  assert.match(demo, /from "@\/components\/ui\/tile-flip-carousel"/)
  assert.doesNotMatch(demo, /https?:\/\//, "the primary demo is self-contained, so 21st can capture it")
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

assert.equal(L.tileDelay(100, 100, 100, 100, 1000, 600, 800), 0, "the tapped tile flips first")
assert.ok(L.tileDelay(0, 0, 1000, 600, 1000, 600, 800) <= 800, "no tile waits longer than the spread")
assert.ok(L.tileDelay(0, 0, 500, 300, 1000, 600, 800) < L.tileDelay(0, 0, 900, 550, 1000, 600, 800), "the wave spreads outward")
for (const d of [1, -1]) for (const r of [0, 0.5, 0.99]) {
  const [x, y] = L.defaultOrigin(d, 1000, 600, r)
  assert.ok(x >= 0 && x <= 1000 && y >= 0 && y <= 600, "the default origin is on the stage")
  assert.ok(d > 0 ? x > 500 : x < 500, "forward starts right of centre, back starts left")
}
assert.match(src, /onAnimationEnd=\{r \* C \+ c === lastKey \? onDone : undefined\}/, "the last tile in the wave commits")
console.log("tile-flip-carousel: ok")
