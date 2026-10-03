// Install-safety, alphabet and layout checks for amour-sunrise-preloader.
// Run: node tests/amour-sunrise-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/amour-sunrise-preloader/", import.meta.url)
const src = readFileSync(new URL("amour-sunrise-preloader.tsx", dir), "utf8")
const demos = Object.fromEntries(
  ["demo", "demo-gate", "demo-sorbet"].map((name) => [name, readFileSync(new URL(name + ".tsx", dir), "utf8")]),
)

// ---- 1. Install safety -----------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import — fonts come from the host or the fallback stack")
assert.doesNotMatch(src, /https?:\/\//, "no external assets: the capture sandbox blocks other origins")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"'), "reports progress to assistive tech")
assert.ok(src.includes("aria-valuenow={pct}"), "progressbar carries its value")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/, "effects must not depend on onComplete identity")
assert.ok((src.match(/cancelAnimationFrame\(raf\)/g) || []).length >= 2, "every frame loop is torn down on unmount")
assert.ok(src.includes("ro.disconnect()"), "the resize observer is torn down on unmount")
assert.ok(src.includes("React.useId()"), "SVG ids are unique per instance")

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const AMR_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "AMR_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.match(css, /\.amr-stage, \.amr-grain \{[^}]*max-width: none/, "the SVGs override Preflight's max-width")

let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".amr-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(rules >= 25, `expected a full scoped sheet, saw ${rules} rules`)
for (const phase of ["bloom", "hold", "lift", "set"]) {
  assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
}
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(reduced, /\.amr-rise \{ transform: none; \}/, "the sun does not climb under reduced motion")
assert.match(reduced, /\[data-phase="lift"\] \.amr-sun-scale \{ transform: none; \}/, "nor swallow the screen")
assert.ok(src.includes("if (!still) {"), "springs and boil are off under reduced motion")

// ---- 3. Geometry helpers, executed -----------------------------------------
const start = src.indexOf("// #region geometry")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "geometry region markers missing")
const js = stripTypeScriptTypes(src.slice(start, end))
const { AMR_GLYPHS, amrGlyph, amrSimulated, amrLit, amrCounter, amrHash, amrPath, amrLine, amrLayout } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// the alphabet: every letter and digit, each stroke inside its box
for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%!?.,'-♥ ") {
  const g = AMR_GLYPHS[ch]
  assert.ok(g, `glyph ${JSON.stringify(ch)} exists`)
  assert.ok(g[0] > 0, `${ch} has an advance`)
  for (const d of g[1]) {
    assert.match(d, /^M[\d\s.MLHVCZ-]+$/, `${ch} uses absolute M/L/H/V/C/Z only`)
    const out = amrPath(d, [1, 0, 0, 1, 0, 0], 0, 0)
    for (const [x, y] of out.match(/-?\d+\.\d/g).reduce((a, v, i, all) => (i % 2 ? a : [...a, [+v, +all[i + 1]]]), [])) {
      assert.ok(x >= 0 && x <= g[0], `${ch}: x ${x} inside its advance`)
      assert.ok(y >= 0 && y <= 100, `${ch}: y ${y} inside the box`)
    }
  }
}
assert.equal(amrGlyph("é"), AMR_GLYPHS.E, "accents drop")
assert.equal(amrGlyph("r"), AMR_GLYPHS.R, "lower case lifts")
assert.equal(amrGlyph("#"), AMR_GLYPHS[" "], "unknown characters are spaces")

// the path mapper
assert.equal(amrPath("M10 20 H30 V40", [1, 0, 0, 1, 0, 0], 0, 0), "M10.0 20.0 L30.0 20.0 L30.0 40.0", "H/V become lines")
assert.equal(amrPath("M10 20 L30 40", [2, 0, 0, 3, 5, 7], 0, 0), "M25.0 67.0 L65.0 127.0", "applies the affine")
assert.equal(amrPath("M0 0 L10 0 Z", [1, 0, 0, 1, 0, 0], 0, 0).endsWith("Z"), true, "keeps Z")
const ring = amrPath(AMR_GLYPHS.O[1][0], [1, 0, 0, 1, 0, 0], 3, 2).match(/-?\d+\.\d/g)
assert.deepEqual(ring.slice(0, 2), ring.slice(-2), "jitter keeps a closed shape closed")
assert.notEqual(amrPath("M10 20 L30 40", [1, 0, 0, 1, 0, 0], 3, 1), amrPath("M10 20 L30 40", [1, 0, 0, 1, 0, 0], 3, 2), "boil frames differ")
for (let i = 0; i < 300; i++) {
  const h = amrHash(i * 1.37)
  assert.ok(h >= 0 && h < 1, "hash stays in [0, 1)")
}

// progress
assert.equal(amrSimulated(-1), 0)
assert.equal(amrSimulated(1), 1)
let prev = 0
for (let i = 1; i <= 400; i++) {
  const v = amrSimulated(i / 400)
  assert.ok(v >= prev - 1e-9 && v <= 1, `simulated progress never runs backwards (t=${i / 400})`)
  prev = v
}
assert.ok(amrSimulated(0.32) - amrSimulated(0.23) < 0.05, "first stall is present")
assert.equal(amrLit(0.5, 0, 5), 1)
assert.equal(amrLit(0.5, 2, 5), 0.5)
assert.equal(amrLit(0.5, 4, 5), 0)
assert.equal(amrCounter(42.4), "42%")
assert.equal(amrCounter(140), "100%")
assert.equal(amrCounter(-3), "0%")
const line = amrLine("12", 0, 0, 76)
assert.ok(Math.abs(line.width - (AMR_GLYPHS["1"][0] + AMR_GLYPHS["2"][0])) < 1e-6, "a line is as wide as its advances")

// the poster layout, across boxes
const widths = "AMOUR".split("").map((c) => AMR_GLYPHS[c][0])
for (const [W, H] of [[1280, 800], [736, 460], [390, 844], [820, 1180], [2560, 900], [320, 320]]) {
  const lay = amrLayout(widths, W, H, 1, 1)
  const at = `${W}×${H}`
  assert.equal(lay.letters.length, 5, at)
  assert.ok(lay.R > 0 && lay.cy >= H, `${at}: the sun sits on the bottom edge`)
  let lastX = -Infinity
  for (const l of lay.letters) {
    assert.ok(l.mx > lastX, `${at}: letters read left to right`)
    lastX = l.mx
    assert.ok(l.mx > 0 && l.mx < W, `${at}: every letter is on screen`)
    assert.ok(l.by <= H, `${at}: no letter stands below the floor`)
    assert.ok(Math.hypot(l.bx - lay.cx, l.by - lay.cy) >= lay.R, `${at}: no letter stands inside the sun`)
    assert.ok(l.my - l.L / 2 > -lay.stroke, `${at}: no letter is cut off at the top`)
    assert.ok(l.sy >= lay.sx * 0.6 - 1e-9, `${at}: letters never squash flat`)
    assert.ok(Math.abs(l.t) <= 0.62, `${at}: the fan stays readable`)
  }
  const outer = lay.letters[0].sy / lay.letters[2].sy
  if (W > H) assert.ok(outer > 1.2, `${at}: outer letters run longer than the middle one, like the poster`)
}
const upright = amrLayout(widths, 1280, 800, 1, 0)
assert.ok(upright.letters.every((l) => l.t === 0), "fan 0 stands every letter upright")

// ---- 4. Demos ---------------------------------------------------------------
for (const [name, d] of Object.entries(demos)) {
  assert.ok(d.includes('from "@/components/ui/amour-sunrise-preloader"'), `${name} imports the canonical path`)
}
assert.match(demos.demo, /<AmourSunrisePreloader loop \/>/, "default demo is the looping component, full bleed")
assert.doesNotMatch(demos.demo, /<div/, "default demo must not wrap the component")
assert.ok(demos["demo-gate"].includes("</AmourSunrisePreloader>"), "gate demo passes children")

console.log("amour-sunrise-preloader: ok")
