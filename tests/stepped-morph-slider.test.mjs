// Install-safety and logic checks for components/stepped-morph-slider.
// Run: node tests/stepped-morph-slider.test.mjs
//
// What fails quietly in a morphing mask: two shapes with different corner
// counts (the morph tears), a shape that leaves its box, a column that turns
// inside out mid-morph, an outline that doesn't close.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "stepped-morph-slider"
const read = (f) => readFileSync(new URL(`../components/${SLUG}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|https?:\/\//, "nothing loads at runtime — default images are painted")
assert.doesNotMatch(src, /\bh-full\b|height:100%/, "no percentage heights")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.(PointerEvent|KeyboardEvent)</, "no generics before the JSX (21st CLI tokenizer)")
assert.match(src, /React\.useId\(\)/, "the clipPath id is namespaced per instance")
assert.match(src, /prefers-reduced-motion/, "reduced motion is honoured")
assert.match(src, /aria-roledescription="carousel"/, "announced as a carousel")
assert.match(src, /ArrowRight[\s\S]*ArrowLeft/, "arrow keys move between slides")
{
  const css = src.match(/const SM_CSS = `([\s\S]*?)`/)[1]
  assert.doesNotMatch(css, /\$\{|(^|[\s}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /\.sm-root\{[^}]*width:100%/, "the root claims full width inside a flex wrapper")
  assert.match(css, /\.sm-svg\{[^}]*max-width:none/, "the svg is guarded against Preflight")
}
{
  const demo = read("demo.tsx")
  assert.match(demo, /from "@\/components\/ui\/stepped-morph-slider"/)
  assert.doesNotMatch(demo, /https?:\/\//, "the primary demo is self-contained, so 21st can capture it")
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b)) + "\nexport { makeShape, lerpShape, shapePath, columnAt, wrap }"),
)

const W = 1000
const H = 600
for (const k of [3, 9, 16]) {
  const shapes = [1, 2, 3, 42, 999].map((s) => L.makeShape(s, k, W, H))
  for (const s of shapes) {
    assert.equal(s.top.length, k)
    assert.equal(s.bot.length, k)
    assert.equal(s.xs.length, k + 1)
    assert.equal(s.xs[0], 0)
    assert.equal(s.xs[k], W, "columns span the full width")
    for (let i = 0; i < k; i++) {
      assert.ok(s.xs[i + 1] > s.xs[i], "columns have width")
      assert.ok(s.top[i] >= 0 && s.bot[i] <= H, "the shape stays in its box")
      assert.ok(s.bot[i] - s.top[i] >= H * 0.1, "no column collapses to a line")
    }
  }
  assert.deepEqual(L.makeShape(7, k, W, H), L.makeShape(7, k, W, H), "a seed is a shape")
  assert.notDeepEqual(L.makeShape(7, k, W, H), L.makeShape(8, k, W, H), "different seeds, different shapes")

  // morphing keeps the corner count and never turns a column inside out
  const [A, B] = shapes
  for (const p of [0, 0.1, 0.33, 0.5, 0.77, 1]) {
    const m = L.lerpShape(A, B, p)
    assert.equal(m.top.length, k)
    for (let i = 0; i < k; i++) {
      assert.ok(m.bot[i] > m.top[i], `column ${i} stays right side out at p=${p}`)
      assert.ok(m.xs[i + 1] >= m.xs[i] - 1e-6, `columns keep their order at p=${p}`)
    }
  }
  assert.deepEqual(L.lerpShape(A, B, 0), A, "p=0 is the old shape")
  assert.deepEqual(L.lerpShape(A, B, 1), B, "p=1 is the new shape")

  const d = L.shapePath(A)
  assert.match(d, /^M[\d.]+ [\d.]+/)
  assert.match(d, /Z$/, "the outline closes")
  assert.equal((d.match(/[ML]/g) || []).length, 4 * k, "four corners per column, the same for every shape")
}

{
  const s = L.makeShape(3, 5, W, H)
  assert.equal(L.columnAt(s, 0), 0)
  assert.equal(L.columnAt(s, W - 0.5), 4)
  assert.equal(L.columnAt(s, -5), -1)
  assert.equal(L.columnAt(s, W + 5), -1)
}
assert.equal(L.wrap(-1, 4), 3)
assert.equal(L.wrap(4, 4), 0)
assert.equal(L.wrap(5, 0), 0, "no slides doesn't divide by zero")

console.log(`${SLUG}: ok`)
