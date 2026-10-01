// Install-safety and timeline checks for crimson-sunburst-preloader.
// Run: node tests/crimson-sunburst-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/crimson-sunburst-preloader/", import.meta.url)
const src = readFileSync(new URL("crimson-sunburst-preloader.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const nocturne = readFileSync(new URL("demo-original.tsx", dir), "utf8")

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
// SVG ids must not collide when two instances share a page.
assert.ok(src.includes("React.useId()"), "gradient, filter and pattern ids come from useId")
assert.doesNotMatch(src, /id="csp-/, "no hard-coded SVG ids")
// No real performer, show or venue ships as a default.
for (const brand of [/saegusa/i, /akina/i, /unity/i, /musashino/i]) {
  assert.doesNotMatch(src + demo + nocturne, brand, `branded string must not ship: ${brand}`)
}

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const CSP_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "CSP_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.match(css, /\.csp-root svg \{[^}]*max-width: none/, "svg overrides Preflight's max-width")

let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".csp-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(rules >= 60, `expected a full scoped sheet, saw ${rules} rules`)

// Every phase that changes the look is styled.
for (const phase of ["load", "ignite", "live"]) {
  assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
}
// Reduced motion stops everything that spins, twinkles or drifts.
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
for (const cls of ["csp-rays-turn", "csp-flames", "csp-spikes", "csp-spark", "csp-float"]) {
  assert.match(reduced, new RegExp("\\." + cls + "\\b[^{]*\\{ animation: none; \\}"), `${cls} stops under reduced motion`)
}
// A selector that loses to `.csp-root svg` would silently do nothing.
assert.doesNotMatch(css, /^\s*\.csp-crest \{ display: none; \}/m, ".csp-crest alone is outranked by .csp-root svg")

// ---- 3. Timeline helpers, executed ----------------------------------------
const start = src.indexOf("// #region timeline")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "timeline region markers missing")
const js = src.slice(start, end).replace(/:\s*(number|string)(\[\])?(?=[,)=])/g, "")
const { cspSimulated, cspCount, cspLit, cspStatus, cspRays, cspFit } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

assert.equal(cspSimulated(-1), 0)
assert.equal(cspSimulated(0), 0)
assert.equal(cspSimulated(1), 1)
assert.equal(cspSimulated(3), 1)
let prev = 0
for (let i = 1; i <= 400; i++) {
  const v = cspSimulated(i / 400)
  assert.ok(v >= prev - 1e-9, `simulated progress must never run backwards (t=${i / 400})`)
  assert.ok(v >= 0 && v <= 1, "simulated progress stays in range")
  prev = v
}
assert.ok(cspSimulated(0.38) - cspSimulated(0.28) < 0.05, "first stall is present")

assert.equal(cspCount(0), "000")
assert.equal(cspCount(0.064), "006")
assert.equal(cspCount(0.64), "064")
assert.equal(cspCount(1), "100")
assert.equal(cspCount(2), "100", "clamps above 1")

assert.equal(cspLit(0, 16), 0)
assert.equal(cspLit(0.5, 16), 8)
assert.equal(cspLit(1, 16), 16)
assert.equal(cspLit(0.99, 16), 15, "the last segment waits for 100%")

const lines = ["a", "b", "c", "d"]
assert.equal(cspStatus(0, lines), "a")
assert.equal(cspStatus(0.3, lines), "b")
assert.equal(cspStatus(1, lines), "d", "100% stays on the last line")
assert.equal(cspStatus(0.5, []), "")

const fan = cspRays(28)
assert.equal(fan.length, 28)
assert.deepEqual(cspRays(28), fan, "the fan is deterministic, so SSR and client agree")
assert.equal(cspRays(2).length, 6, "never fewer than six rays")
for (const ray of fan) {
  assert.ok(ray.angle >= 0 && ray.angle < 360, "angles are normalised")
  assert.ok(ray.half > 0 && ray.half < 6, "half-angles stay narrow")
  assert.ok([0, 1, 2].includes(ray.tone), "tone is red, slate or deep")
  assert.ok(ray.start >= 0 && ray.start < 0.7, "every ray starts before 70%, so the fan is full at 100%")
}
assert.ok(fan.filter((r) => r.tone === 0).length === 14, "every other ray is red")

assert.ok(cspFit(10) > cspFit(14), "longer titles set smaller")
assert.ok(cspFit(1) <= 17, "short titles are capped")
assert.ok(cspFit(10) * 10 * 0.7 <= 100, "a ten-character title fits the width")

// ---- 4. Demos ---------------------------------------------------------------
assert.ok(demo.includes('from "@/components/ui/crimson-sunburst-preloader"'), "demo imports the canonical path")
assert.match(demo, /<CrimsonSunburstPreloader[\s/>]/, "default demo is the component, full bleed")
assert.doesNotMatch(demo, /<div/, "default demo must not wrap the component")
assert.ok(nocturne.includes('from "@/components/ui/crimson-sunburst-preloader"'), "original demo imports the canonical path")

console.log("crimson-sunburst-preloader: ok")
