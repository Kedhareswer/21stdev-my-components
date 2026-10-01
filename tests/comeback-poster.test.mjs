// Install-safety and lifted-logic check for components/comeback-poster.
// Run: node tests/comeback-poster.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/comeback-poster/", import.meta.url)
const src = readFileSync(new URL("comeback-poster.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.deepEqual(
  readdirSync(dir).sort(),
  ["README.md", "comeback-poster.tsx", "demo-marigold.tsx", "demo.tsx"],
  "the folder ships the component, its demos and a README — nothing else",
)

assert.ok(src.includes('height = "100svh"'), "root height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere: percentage heights collapse on an installed page")
assert.ok(/style=\{\s*\{\s*height,/.test(src), "the root takes its height from the prop")

// Generic type arguments hang the 21st CLI tokenizer (see commit a73538c).
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback)</, "no generic hook type arguments")
assert.doesNotMatch(src, /\b(Record|Array|MutableRefObject|RefObject)</, "no generic utility types")

// Fonts arrive by <link>, never an @import, and can be switched off.
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('document.createElement("link")'), "fonts are injected as a link")
assert.ok(src.includes("if (!fontHref) return"), "fontHref={null} must load nothing")

// The scoped CSS string: prefixed selectors only, no bare resets, no template holes.
const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{/, "no backticks or ${ in the CSS string")
for (const bad of [/"\*\s*\{/, /[{}"]\s*body\s*\{/, /:root/, /[{}"]\s*html\s*\{/])
  assert.doesNotMatch(css, bad, "no bare resets in the CSS: " + bad)
for (const rule of css.matchAll(/"([^"@{][^"{]*)\{/g)) {
  const sel = rule[1].trim()
  if (/^(from|to|\d+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".cbp-")), "unscoped selector: " + sel)
}
assert.ok(css.includes("prefers-reduced-motion"), "CSS honours reduced motion")

// Preflight: canvases and absolutely-sized SVGs must not be clamped by max-width.
assert.ok((src.match(/maxWidth: "none"/g) || []).length >= 4, "media guard Preflight's max-width")

// Runtime hygiene.
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 2)"), "cap DPR at 2")
assert.ok(src.includes('"visibilitychange"') && src.includes("IntersectionObserver"), "pause off-screen")
assert.ok(src.includes("const moving = L.windOn && !L.reduced"), "reduced motion and the wind toggle stop the clock")
assert.ok(src.includes('matchMedia("(prefers-reduced-motion: reduce)")'), "reduced motion is read")
for (const gone of [
  "cancelAnimationFrame(raf)", "io.disconnect()", "ro.disconnect()",
  'document.removeEventListener("visibilitychange", onVis)',
]) assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes('aria-pressed={kept === w}'), "theme words are toggle buttons")
assert.ok(src.includes('role="img"'), "the painting is described for screen readers")

// ---- the lifted logic ---------------------------------------------------------------
const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "logic region markers missing")
const L = await import(
  "data:text/javascript," +
    encodeURIComponent(
      stripTypeScriptTypes(src.slice(start, end)) +
        "\nexport { rng, hexRGB, mix, project, depthAt, scatter, scrambleAt, splitDate, chunkRows, wavePath, easeOutBack, VARIANTS }",
    )
)

{
  const a = L.rng(5)
  const b = L.rng(5)
  for (let i = 0; i < 50; i++) {
    const x = a()
    assert.equal(x, b(), "rng is deterministic")
    assert.ok(x >= 0 && x < 1, "rng in [0, 1)")
  }
}
{
  assert.deepEqual(L.hexRGB("#d9301d", [0, 0, 0]), [217, 48, 29])
  assert.deepEqual(L.hexRGB("#fff", [0, 0, 0]), [255, 255, 255])
  assert.deepEqual(L.hexRGB("oklch(0.6 0.2 30)", [1, 2, 3]), [1, 2, 3], "non-hex falls back")
  assert.deepEqual(L.hexRGB(undefined, [1, 2, 3]), [1, 2, 3], "missing falls back")
  assert.deepEqual(L.mix([0, 0, 0], [200, 100, 50], 0.5), [100, 50, 25])
}
{
  const H = 900
  const hz = 300
  assert.equal(L.project(0, hz, H).y, hz, "depth 0 sits on the horizon")
  assert.ok(L.project(1, hz, H).y > H, "the nearest poppies root just past the bottom edge")
  let prev = -1
  for (let z = 0; z <= 1.0001; z += 0.01) {
    const { y, s } = L.project(z, hz, H)
    assert.ok(y > prev, "nearer is lower")
    prev = y
    assert.ok(s > 0 && s < 1.5, "scale is sane")
    assert.ok(Math.abs(L.depthAt(y, hz, H) - Math.min(1, z)) < 1e-9, "depthAt inverts project at " + z)
  }
  assert.equal(L.depthAt(0, hz, H), 0, "above the horizon clamps to 0")
}
{
  const a = L.scatter(7, 220)
  assert.equal(a.length, 220)
  assert.deepEqual(L.scatter(7, 220), a, "same seed, same field")
  assert.notDeepEqual(L.scatter(8, 220), a, "different seed, different field")
  for (let i = 1; i < a.length; i++) assert.ok(a[i].z >= a[i - 1].z, "sorted far to near")
  for (const p of a) {
    assert.ok(p.z >= 0.16 && p.z <= 1, "depth in range")
    assert.ok(Number.isInteger(p.variant) && p.variant >= 0 && p.variant < L.VARIANTS, "variant indexes a sprite")
  }
  assert.equal(L.scatter(1, 99999).length, 600, "capped")
  assert.equal(L.scatter(1, -4).length, 0, "negative is none")
  assert.equal(L.scatter(1, NaN).length, 0, "NaN is none")
}
{
  const r = L.rng(1)
  assert.equal(L.scrambleAt("Comeback", "Passion", 1, r), "Passion", "lands on the word")
  assert.equal(L.scrambleAt("Comeback", "Passion", 0.5, r).length, 7, "always the target's length")
  assert.equal(L.scrambleAt("x", "Two words", 0.3, r)[3], " ", "spaces never flicker")
  const mid = L.scrambleAt("Comeback", "Passion", 0.6, r)
  assert.equal(mid[0], "P", "early letters settle first")
}
{
  assert.deepEqual(L.splitDate("25.02.25"), ["25", "02", "25"])
  assert.deepEqual(L.splitDate("25/02/25"), ["25", "02", "25"])
  assert.deepEqual(L.splitDate(" 05 - 03 - 25 "), ["05", "03", "25"])
}
{
  const w = "abcdefghijkl".split("")
  assert.deepEqual(L.chunkRows(w, false).map((r) => r.length), [6, 4, 2], "the print's 6 / 4 / 2")
  assert.deepEqual(L.chunkRows(w, true).map((r) => r.length), [4, 4, 4], "rows of 4 when narrow")
  assert.deepEqual(L.chunkRows(w.slice(0, 5), false).map((r) => r.length), [5])
  assert.deepEqual(L.chunkRows([], false), [], "no words, no rows")
}
{
  for (const amp of [0, 0.5, 1]) {
    const d = L.wavePath(3, 1200, 7, 600, 20, amp)
    assert.match(d, /^M[\d.]+ -?[\d.]+(L[\d.]+ -?[\d.]+)+$/, "a plain polyline")
    assert.doesNotMatch(d, /NaN|Infinity/, "finite")
  }
  assert.notEqual(L.wavePath(3, 1200, 7, 600, 20, 1), L.wavePath(3, 1200, 7, 600, 20, 0), "the pointer bends the line")
  assert.equal(L.wavePath(3, 1200, 7, 600, 20, 0), L.wavePath(3, 1200, 7, 0, 0, 0), "no amplitude, no pointer")
}
{
  assert.equal(L.easeOutBack(0), 0)
  assert.ok(Math.abs(L.easeOutBack(1) - 1) < 1e-12)
  assert.ok(L.easeOutBack(0.7) > 1, "overshoots before settling")
}

// ---- demos ---------------------------------------------------------------------------
for (const f of ["demo.tsx", "demo-marigold.tsx"]) {
  const demo = readFileSync(new URL(f, dir), "utf8")
  assert.ok(demo.includes('from "@/components/ui/comeback-poster"'), f + " imports the installed path")
  assert.ok(demo.includes('className="w-full"'), f + " wrapper keeps full width")
}

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/comeback-poster"'), "tsconfig paths line missing")

console.log("comeback-poster: ok")
