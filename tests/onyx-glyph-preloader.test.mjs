// Install-safety and timeline checks for onyx-glyph-preloader.
// Run: node tests/onyx-glyph-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/onyx-glyph-preloader/", import.meta.url)
const src = readFileSync(new URL("onyx-glyph-preloader.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const gate = readFileSync(new URL("demo-gate.tsx", dir), "utf8")
const custom = readFileSync(new URL("demo-original.tsx", dir), "utf8")

// ---- 1. Install safety -----------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import — fonts come from the host or the fallback stack")
assert.doesNotMatch(src, /https?:\/\//, "no external assets: every texture is painted on canvas")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"'), "reports progress to assistive tech")
assert.ok(src.includes("aria-valuenow={pct}"), "progressbar carries its value")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/, "effects must not depend on onComplete identity")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
// toBlob is scheduled into idle time and never resolves on a page this busy.
assert.doesNotMatch(src, /toBlob\(/, "textures are encoded synchronously")
// Canvas painting must stay out of render so SSR never touches document.
assert.doesNotMatch(src, /useMemo\([^)]*paintAll/, "textures are painted in an effect, not during render")

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const OGP_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "OGP_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.match(css, /\.ogp-root svg, \.ogp-root canvas, \.ogp-root img \{[^}]*max-width: none/, "media overrides Preflight's max-width")

let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".ogp-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(rules >= 60, `expected a full scoped sheet, saw ${rules} rules`)
// The universal box-sizing rule must not reach into the children it guards.
assert.doesNotMatch(css, /\.ogp-root \*/, "box-sizing stays inside the gate, off the host's children")

for (const phase of ["forge", "reveal", "lift"]) {
  assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
}

// Opacity or filter on a preserve-3d element flattens it, and the tiles lose
// their thickness. Fades and focus pulls belong on the leaves only.
for (const block of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const body = block[2]
  if (!/transform-style: preserve-3d/.test(body)) continue
  assert.doesNotMatch(body, /(^|\s)(opacity|filter):/, `3D container must not fade or filter: ${block[1].trim()}`)
}

const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(reduced, /\.ogp-ring, \.ogp-counter, \.ogp-bob, \.ogp-hero-bob \{ animation: none; \}/, "no orbit under reduced motion")
assert.match(reduced, /\.ogp-dust \{ display: none; \}/, "no drifting dust under reduced motion")
assert.match(reduced, /\.ogp-grain \{ animation: none; \}/, "grain holds still under reduced motion")

// ---- 3. Timeline helpers, executed ----------------------------------------
const start = src.indexOf("// #region timeline")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "timeline region markers missing")
const js = src.slice(start, end).replace(/:\s*(number|string)(?=[,)])/g, "")
const { ogpSimulated, ogpLit, ogpCount, ogpSlot, ogpRng } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

assert.equal(ogpSimulated(-1), 0)
assert.equal(ogpSimulated(0), 0)
assert.equal(ogpSimulated(1), 1)
assert.equal(ogpSimulated(3), 1)
let prev = 0
for (let i = 1; i <= 400; i++) {
  const v = ogpSimulated(i / 400)
  assert.ok(v >= prev - 1e-9, `simulated progress must never run backwards (t=${i / 400})`)
  assert.ok(v >= 0 && v <= 1, "simulated progress stays in range")
  prev = v
}
assert.ok(ogpSimulated(0.34) - ogpSimulated(0.24) < 0.05, "first stall is present")

// five tiles each own a fifth of the load
assert.equal(ogpLit(0, 0, 5), 0)
assert.equal(ogpLit(0.1, 0, 5), 0.5)
assert.equal(ogpLit(0.2, 0, 5), 1)
assert.equal(ogpLit(0.2, 1, 5), 0)
assert.equal(ogpLit(1, 4, 5), 1)
assert.equal(ogpLit(2, 4, 5), 1, "clamps above 1")
assert.equal(ogpLit(-1, 0, 5), 0, "clamps below 0")

assert.equal(ogpCount(0, 5), 0)
assert.equal(ogpCount(0.39, 5), 1)
assert.equal(ogpCount(0.4, 5), 2)
assert.equal(ogpCount(0.6, 5), 3, "float error must not drop a tile at its exact boundary")
assert.equal(ogpCount(1, 5), 5)
assert.equal(ogpCount(1.5, 5), 5)

assert.deepEqual(ogpSlot(0, 5), { x: 0, y: -1 }, "first tile sits at twelve o'clock")
assert.deepEqual(ogpSlot(1, 4), { x: 1, y: 0 }, "and the ring runs clockwise")
for (let i = 0; i < 7; i++) {
  const { x, y } = ogpSlot(i, 7)
  assert.ok(Math.abs(Math.hypot(x, y) - 1) < 1e-3, "slots sit on the unit circle")
}

const a = ogpRng(42)
const b = ogpRng(42)
const seq = Array.from({ length: 50 }, () => a())
assert.deepEqual(seq, Array.from({ length: 50 }, () => b()), "the glitter is the same on every mount")
assert.ok(seq.every((v) => v >= 0 && v < 1), "rng stays in [0, 1)")
assert.notDeepEqual(seq, Array.from({ length: 50 }, ogpRng(43)), "different seeds differ")

// ---- 4. No third-party marks -----------------------------------------------
for (const brand of [/slack/i, /framer/i, /stripe/i, /paypal/i]) {
  assert.doesNotMatch(src + demo + gate + custom, brand, `brand must not ship: ${brand}`)
}

// ---- 5. Demos ---------------------------------------------------------------
for (const [name, d] of [["demo", demo], ["demo-gate", gate], ["demo-original", custom]]) {
  assert.ok(d.includes('from "@/components/ui/onyx-glyph-preloader"'), `${name} imports the canonical path`)
}
assert.match(demo, /<OnyxGlyphPreloader\s+loop[\s/>]/, "default demo is the looping component, full bleed")
assert.doesNotMatch(demo, /<div/, "default demo must not wrap the component")
assert.match(gate, /<OnyxGlyphPreloader key=\{run\}/, "gate demo can replay itself")

console.log("onyx-glyph-preloader: ok")
