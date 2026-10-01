// Install-safety and timeline checks for fire-horse-preloader.
// Run: node tests/fire-horse-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/fire-horse-preloader/", import.meta.url)
const src = readFileSync(new URL("fire-horse-preloader.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const gate = readFileSync(new URL("demo-gate.tsx", dir), "utf8")

// ---- 1. Install safety -----------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import — fonts come from the host or the fallback stack")
assert.doesNotMatch(src, /https?:\/\/(?!www\.w3\.org)/, "no external assets: the capture sandbox blocks other origins")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"'), "reports progress to assistive tech")
assert.ok(src.includes("aria-valuenow={pct}"), "progressbar carries its value")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/, "effects must not depend on onComplete identity")
// SVG ids must not collide when two instances share a page.
assert.ok(src.includes("React.useId()"), "mask and pattern ids come from useId")
assert.doesNotMatch(src, /id="fhp-/, "no hard-coded SVG ids")

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const FHP_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "FHP_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.match(css, /\.fhp-root svg \{[^}]*max-width: none/, "svg overrides Preflight's max-width")

let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".fhp-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(rules >= 40, `expected a full scoped sheet, saw ${rules} rules`)

// Every phase the engine can enter that changes the look is styled.
for (const phase of ["seal", "verse", "lift"]) {
  assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
}
// Reduced motion must not flip the card in 3D.
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(reduced, /\.fhp-card \{ animation: none; \}/, "no 3D turn under reduced motion")
assert.match(reduced, /\.fhp-embers \{ display: none; \}/, "no ember field under reduced motion")

// ---- 3. Timeline helpers, executed ----------------------------------------
const start = src.indexOf("// #region timeline")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "timeline region markers missing")
const js = src.slice(start, end).replace(/:\s*(number|string)(?=[,)])/g, "")
const { fhpSimulated, fhpCount, fhpSplit, fhpVerse } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

assert.equal(fhpSimulated(-1), 0)
assert.equal(fhpSimulated(0), 0)
assert.equal(fhpSimulated(1), 1)
assert.equal(fhpSimulated(2), 1)
let prev = 0
for (let i = 1; i <= 400; i++) {
  const v = fhpSimulated(i / 400)
  assert.ok(v >= prev - 1e-9, `simulated progress must never run backwards (t=${i / 400})`)
  assert.ok(v >= 0 && v <= 1, "simulated progress stays in range")
  prev = v
}
// it stalls: the stretch between the first two knots barely moves
assert.ok(fhpSimulated(0.42) - fhpSimulated(0.32) < 0.05, "first stall is present")

assert.equal(fhpCount("26", 0), "00")
assert.equal(fhpCount("26", 0.5), "13")
assert.equal(fhpCount("26", 1), "26")
assert.equal(fhpCount("20", 2), "20", "clamps above 1")
assert.equal(fhpCount("7", 0.5), "4")
assert.equal(fhpCount("XX", 1), "XX", "non-numeric years are shown once loaded")
assert.notEqual(fhpCount("XX", 0.5), "XX", "and blanked before")

assert.deepEqual(fhpSplit("Mã hóa"), ["Mã", "hóa"])
assert.deepEqual(fhpSplit("  Fire  Horse Year "), ["Fire", "Horse Year"])
assert.deepEqual(fhpSplit("Horse"), ["Hor", "se"])

assert.deepEqual(fhpVerse("Mã hoá khai [Xuân]"), [
  { text: "Mã hoá khai ", mark: false },
  { text: "Xuân", mark: true },
])
assert.deepEqual(fhpVerse("[Đông] đủ hạnh phúc"), [
  { text: "Đông", mark: true },
  { text: " đủ hạnh phúc", mark: false },
])
assert.deepEqual(fhpVerse("plain"), [{ text: "plain", mark: false }])

// ---- 4. Demos ---------------------------------------------------------------
assert.ok(demo.includes('from "@/components/ui/fire-horse-preloader"'), "demo imports the canonical path")
assert.ok(demo.includes("<FireHorsePreloader loop />"), "default demo is the looping component, full bleed")
assert.doesNotMatch(demo, /<div/, "default demo must not wrap the component")
assert.ok(gate.includes('from "@/components/ui/fire-horse-preloader"'), "gate demo imports the canonical path")

console.log("fire-horse-preloader: ok")
