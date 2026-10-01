// Install-safety and timeline checks for hollow-tide-preloader.
// Run: node tests/hollow-tide-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/hollow-tide-preloader/", import.meta.url)
const src = readFileSync(new URL("hollow-tide-preloader.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const gate = readFileSync(new URL("demo-gate.tsx", dir), "utf8")
const ink = readFileSync(new URL("demo-original.tsx", dir), "utf8")

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
// clip and filter ids must not collide when two instances share a page
assert.ok(src.includes("React.useId()"), "clip and filter ids come from useId")
assert.doesNotMatch(src, /id="htp-/, "no hard-coded SVG ids")
// the outline is a hairline at any size
assert.ok(src.includes('vectorEffect="non-scaling-stroke"'), "outline does not scale with the numerals")

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const HTP_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "HTP_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.match(css, /\.htp-root svg \{[^}]*max-width: none/, "svg overrides Preflight's max-width")

let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".htp-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(rules >= 25, `expected a full scoped sheet, saw ${rules} rules`)

for (const phase of ["flood", "lift"]) {
  assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
}
// The flood and its contents must move by the same amount on the same curve,
// or the inverted type slides instead of being uncovered in place.
const floodT = css.match(/\.htp-flood \{[^}]*transform: translate3d\(0, calc\(100% \+ (\d+)px\), 0\);[^}]*transition: ([^;]+);/)
const innerT = css.match(/\.htp-flood-inner \{[^}]*transform: translate3d\(0, calc\(-100% - (\d+)px\), 0\);[^}]*transition: ([^;]+);/)
assert.ok(floodT && innerT, "flood and inner both have an offset and a transition")
assert.equal(floodT[1], innerT[1], "flood and inner offsets cancel")
assert.equal(floodT[2], innerT[2], "flood and inner share one transition")

const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(reduced, /\.htp-grain \{ animation: none; \}/, "grain holds still under reduced motion")
assert.match(reduced, /\.htp-crest \{ display: none; \}/, "no animated crest under reduced motion")

// ---- 3. Timeline helpers, executed ----------------------------------------
const start = src.indexOf("// #region timeline")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "timeline region markers missing")
const js = src.slice(start, end).replace(/:\s*(number|string)(?=[,)])/g, "")
const { htpSimulated, htpLevel, htpWave, htpWrap, htpReadout } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

assert.equal(htpSimulated(-1), 0)
assert.equal(htpSimulated(0), 0)
assert.equal(htpSimulated(1), 1)
assert.equal(htpSimulated(3), 1)
let prev = 0
for (let i = 1; i <= 500; i++) {
  const v = htpSimulated(i / 500)
  assert.ok(v >= prev - 1e-9, `simulated progress must never run backwards (t=${i / 500})`)
  assert.ok(v >= 0 && v <= 1, "simulated progress stays in range")
  prev = v
}
assert.ok(htpSimulated(0.62) - htpSimulated(0.52) < 0.03, "the stall at 41% is present")

// the waterline: below the glyph foot at 0, above the glyph top at 1
const base = 320
const top = 75
const reach = 12
assert.equal(htpLevel(0, base, top, reach), base + reach)
assert.equal(htpLevel(1, base, top, reach), top - reach)
assert.equal(htpLevel(2, base, top, reach), top - reach, "clamps above 1")
assert.ok(htpLevel(0.5, base, top, reach) < htpLevel(0.4, base, top, reach), "rises as progress grows")

// the wave never leaves its band, so `reach` really does cover it
const wave = htpWave(200, 10, 1.3, 0.02, 1000, 440)
assert.match(wave, /^M0 [\d.-]+(L[\d.-]+ [\d.-]+)+Z$/, "closed path of line segments")
assert.ok(wave.endsWith("L1000 440L0 440Z"), "closes along the floor")
const ys = [...wave.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].slice(0, 41).map((m) => [Number(m[1]), Number(m[2])])
assert.equal(ys.length, 41)
for (const [x, y] of ys) {
  const rest = 200 + 0.02 * (x - 500)
  assert.ok(Math.abs(y - rest) <= 10.1, `wave stays within its amplitude at x=${x}`)
}
assert.ok(htpWave(200, 0, 0, 0, 1000, 440).startsWith("M0 200L25 200"), "flat when still")

assert.equal(htpWrap(0, 500), 0)
assert.equal(htpWrap(1250, 500), 250)
assert.equal(htpWrap(-100, 500), 400)
assert.equal(htpWrap(300, 0), 0, "unmeasured band does not divide by zero")

assert.equal(htpReadout(0.41, "%"), "41%")
assert.equal(htpReadout(0.999, "%"), "100%")
assert.equal(htpReadout(1.4, ""), "100")
assert.equal(htpReadout(-1, "%"), "0%")

// ---- 4. Demos ---------------------------------------------------------------
for (const [name, d] of [["demo", demo], ["demo-gate", gate], ["demo-original", ink]]) {
  assert.ok(d.includes('from "@/components/ui/hollow-tide-preloader"'), `${name} imports the canonical path`)
}
assert.match(demo, /<HollowTidePreloader\s+loop[\s/>]/, "default demo is the looping component, full bleed")
assert.doesNotMatch(demo, /<div/, "default demo must not wrap the component")
assert.ok(gate.includes("progress={"), "gate demo drives real progress")

console.log("hollow-tide-preloader: ok")
