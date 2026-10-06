// Install-safety and logic checks for components/ink-blot-carousel.
// Run: node tests/ink-blot-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "ink-blot-carousel"
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
  const css = src.match(/const IB_CSS = \[([\s\S]*?)\]\.join/)[1]
  assert.doesNotMatch(css, /$\{|`|(^|[\s"}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /-root\{[^}]*width:100%/, "the root claims full width")
  assert.match(css, /max-width:none/, "images are guarded against Preflight")
}
{
  const demo = read("demo.tsx")
  assert.match(demo, /from "@\/components\/ui\/ink-blot-carousel"/)
  assert.doesNotMatch(demo, /https?:\/\//, "the primary demo is self-contained, so 21st can capture it")
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

assert.equal(L.easeInOut(0), 0)
assert.equal(L.easeInOut(1), 1)
assert.equal(L.easeInOut(0.5), 0.5)
assert.ok(L.easeInOut(0.1) < 0.1 && L.easeInOut(0.9) > 0.9, "slow start, slow finish")
assert.equal(L.reach(0, 0, 3, 4), 5)
const d1 = L.drops(1234, 7)
assert.equal(d1.length, 7)
assert.deepEqual(d1, L.drops(1234, 7), "the same tap inks the same way")
for (const [dx, dy, s] of d1) assert.ok(Math.hypot(dx, dy) <= 180 && s > 0 && s < 1, "drops stay near the blot")
assert.match(src, /React\.useId\(\)/, "mask and filter ids are unique per instance")
assert.doesNotMatch(src, /filterUnits="userSpaceOnUse"/, "the filter region follows the blot (userSpace broke the mask)")
console.log("ink-blot-carousel: ok")
