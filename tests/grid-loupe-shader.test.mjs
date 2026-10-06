// Install-safety and logic checks for components/grid-loupe-shader.
// Run: node tests/grid-loupe-shader.test.mjs
//
// What fails quietly in a loupe: a lens that samples outside its own cell
// (cells smear into each other), a radius of 0 that divides by zero, a cover
// crop that letterboxes, a shader that drifts from the JS it mirrors.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "grid-loupe-shader"
const read = (f) => readFileSync(new URL(`../components/${SLUG}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|https?:\/\//, "nothing loads at runtime — the default image is painted")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /height = "100svh"/, "explicit default height")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</, "no generics before the JSX (21st CLI tokenizer)")
assert.match(src, /prefers-reduced-motion/, "reduced motion is honoured")
assert.match(src, /crossOrigin = "anonymous"/, "remote images are requested with CORS")
assert.match(src, /IntersectionObserver/, "the loop sleeps off-screen")
{
  const css = src.match(/const GL_CSS = \[([\s\S]*?)\]\.join/)[1]
  assert.doesNotMatch(css, /\$\{|`|(^|[\s"}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /\.gl-root\{[^}]*width:100%/, "the root claims full width")
  assert.match(css, /max-width:none/, "absolute media is guarded against Preflight")
}
{
  const frag = src.match(/const FRAG = \[([\s\S]*?)\]\.join/)[1]
  assert.match(frag, /1\.-clamp\(distance\(c,u_mouse\)\/u_radius,0\.,1\.\)/, "shader lens matches lensAt")
  assert.match(frag, /cell\+u_box\*s\*\.5\+\(p-cell\)\*\(1\.-s\)/, "shader sampling matches sampleOffset")
}
{
  const demo = read("demo.tsx")
  assert.match(demo, /from "@\/components\/ui\/grid-loupe-shader"/)
  assert.doesNotMatch(demo, /https?:\/\//, "the primary demo is self-contained, so 21st can capture it")
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))),
)

assert.equal(L.lensAt(0, 100), 1, "full strength at the centre")
assert.equal(L.lensAt(100, 100), 0)
assert.equal(L.lensAt(500, 100), 0, "clamped outside")
assert.equal(L.lensAt(10, 0), 0, "zero radius is off, not NaN")

for (const s of [0, 0.25, 0.5, 0.99, 1]) {
  for (const box of [25, 72, 250]) {
    for (const l of [0, box / 3, box]) {
      const o = L.sampleOffset(l, box, s)
      assert.ok(o >= -1e-9 && o <= box + 1e-9, "a cell only ever samples inside itself")
    }
  }
}
assert.equal(L.sampleOffset(30, 72, 0), 30, "strength 0 is the untouched image")
assert.equal(L.sampleOffset(0, 72, 1), 36, "strength 1 flattens the cell to its centre colour")
assert.equal(L.sampleOffset(72, 72, 1), 36)

assert.ok(Math.abs(L.approach(0, 10, 1, 7) - 10) < 0.01, "settles within a second at k=7")
assert.equal(L.approach(3, 3, 0.016, 7), 3)
assert.ok(L.approach(0, 10, 0.016, 7) > 0 && L.approach(0, 10, 0.016, 7) < 10)

for (const [w, h, iw, ih] of [[1600, 1000, 1800, 1200], [390, 844, 1800, 1200], [1000, 1000, 2000, 1000], [500, 2000, 800, 800]]) {
  const [sx, sy] = L.coverScale(w, h, iw, ih)
  assert.ok(sx <= 1 && sy <= 1 && Math.max(sx, sy) === 1, "cover crops, never letterboxes")
  assert.ok(Math.abs((sx * iw) / (sy * ih) - w / h) < 1e-9, "the crop keeps the box's aspect")
}

assert.deepEqual(L.hexToRgb("#fff"), [1, 1, 1])
assert.deepEqual(L.hexToRgb("#ff0000"), [1, 0, 0])
assert.deepEqual(L.hexToRgb("tomato"), [1, 1, 1], "unparseable colours fall back to white")

{
  const r1 = L.rng(42)
  const r2 = L.rng(42)
  for (let i = 0; i < 50; i++) {
    const v = r1()
    assert.equal(v, r2(), "the painting is deterministic")
    assert.ok(v >= 0 && v < 1)
  }
}

console.log("grid-loupe-shader: ok")
