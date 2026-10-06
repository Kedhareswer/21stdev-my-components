// Install-safety and logic checks for components/card-deck-carousel.
// Run: node tests/card-deck-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "card-deck-carousel"
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
  const css = src.match(/const CD_CSS = \[([\s\S]*?)\]\.join/)[1]
  assert.doesNotMatch(css, /$\{|`|(^|[\s"}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /-root\{[^}]*width:100%/, "the root claims full width")
  assert.match(css, /max-width:none/, "images are guarded against Preflight")
}
{
  const demo = read("demo.tsx")
  assert.match(demo, /from "@\/components\/ui\/card-deck-carousel"/)
  assert.doesNotMatch(demo, /https?:\/\//, "the primary demo is self-contained, so 21st can capture it")
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

const top = L.deckPose(0, 5)
assert.equal(top.rot, 0, "the top card sits straight")
assert.equal(top.y, 0)
assert.equal(top.scale, 1)
for (let d = 1; d < 8; d++) {
  const p = L.deckPose(d, 5)
  const q = L.deckPose(d - 1, 5)
  assert.ok(p.scale <= q.scale && p.y <= q.y, "deeper cards sit higher and smaller")
  assert.equal(p.opacity, d > 3 ? 0 : 1, "only the top four show")
}
assert.equal(L.deckPose(2, 5, true).rot, 0, "reduced motion squares the pile")
for (let i = 0; i < 40; i++) {
  const t = L.tiltFor(i, 6)
  assert.ok(Math.abs(t) <= 6, "tilt within scatter")
  assert.equal(t, L.tiltFor(i, 6), "stable per card")
}
assert.ok(L.isThrow(200, 0, 400), "a long drag throws")
assert.ok(L.isThrow(-60, -0.9, 400), "a short fast flick throws")
assert.ok(!L.isThrow(60, 0.1, 400), "a nudge springs back")
assert.ok(!L.isThrow(10, 2, 400), "a tap is not a throw")
console.log("card-deck-carousel: ok")
