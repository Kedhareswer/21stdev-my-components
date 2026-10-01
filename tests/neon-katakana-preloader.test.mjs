// Install-safety and timeline checks for neon-katakana-preloader.
// Run: node tests/neon-katakana-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/neon-katakana-preloader/", import.meta.url)
const src = readFileSync(new URL("neon-katakana-preloader.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const gate = readFileSync(new URL("demo-gate.tsx", dir), "utf8")
const custom = readFileSync(new URL("demo-original.tsx", dir), "utf8")

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
assert.ok(src.includes("cancelAnimationFrame(raf)"), "the frame loop is torn down on unmount")
assert.ok(src.includes("ro.disconnect()"), "the resize observer is torn down on unmount")

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const NKP_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "NKP_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.match(css, /\.nkp-root canvas \{[^}]*max-width: none/, "canvas overrides Preflight's max-width")

let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".nkp-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(rules >= 30, `expected a full scoped sheet, saw ${rules} rules`)

for (const phase of ["lock", "open", "release"]) {
  assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
}
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(reduced, /\.nkp-frame \{ display: none; \}/, "no window-frame zoom under reduced motion")
assert.match(reduced, /\[data-phase="open"\] \.nkp-gate \{ animation: nkp-fade/, "the gate fades instead of tearing open")
// the canvas side: reduced motion turns the rain and the glitch off
assert.ok(src.includes("reduced ? 0 : dens"), "no rain under reduced motion")
assert.ok(src.includes("if (!reduced) {"), "no glitch under reduced motion")

// ---- 3. Timeline helpers, executed ----------------------------------------
const start = src.indexOf("// #region timeline")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "timeline region markers missing")
const js = src.slice(start, end).replace(/:\s*(number|string)(?=[,)])/g, "")
const { nkpSimulated, nkpHash, nkpDecode, nkpCounter, nkpLayout } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

assert.equal(nkpSimulated(-1), 0)
assert.equal(nkpSimulated(0), 0)
assert.equal(nkpSimulated(1), 1)
assert.equal(nkpSimulated(3), 1)
let prev = 0
for (let i = 1; i <= 400; i++) {
  const v = nkpSimulated(i / 400)
  assert.ok(v >= prev - 1e-9, `simulated progress must never run backwards (t=${i / 400})`)
  assert.ok(v >= 0 && v <= 1, "simulated progress stays in range")
  prev = v
}
assert.ok(nkpSimulated(0.4) - nkpSimulated(0.3) < 0.05, "first stall is present")

for (let i = 0; i < 500; i++) {
  const h = nkpHash(i * 1.37)
  assert.ok(h >= 0 && h < 1, "hash stays in [0, 1)")
}
assert.equal(nkpHash(42), nkpHash(42), "hash is deterministic")

assert.equal(nkpDecode("window", 1, 3), "window", "fully decoded at p = 1")
assert.equal(nkpDecode("window", 0.5, 3).slice(0, 3), "win", "the first half settles first")
assert.equal(nkpDecode("window", 0.5, 3).length, 6, "keeps its length while scrambling")
assert.notEqual(nkpDecode("window", 0, 3), nkpDecode("window", 0, 4), "scramble moves with the tick")
assert.equal(nkpDecode("a b", 0, 9).charAt(1), " ", "spaces never scramble")
assert.match(nkpDecode("ウィンドウ", 0, 1), /^[゠-ヿ]{5}$/, "katakana scrambles into katakana")
assert.match(nkpDecode("WIN", 0, 2), /^[A-Z0-9#$%&@]{3}$/, "capitals scramble into capitals")

assert.equal(nkpCounter(0), "000")
assert.equal(nkpCounter(7), "007")
assert.equal(nkpCounter(42.6), "043")
assert.equal(nkpCounter(140), "100", "clamps above 100")
assert.equal(nkpCounter(-5), "000", "clamps below 0")

const wide = nkpLayout(5, 500, 1280, 800)
assert.equal(wide.vertical, false, "landscape sets the word in one line")
assert.ok(wide.size * 5 <= 1280 * 0.84 + 5, "and it fits the width")
const tall = nkpLayout(5, 500, 390, 844)
assert.equal(tall.vertical, true, "a tall phone stacks the word vertically")
assert.ok(tall.size * 5 <= 844 * 0.6 + 5, "and it fits the height")
assert.equal(nkpLayout(1, 100, 390, 844).vertical, false, "a single glyph never goes vertical")
assert.ok(nkpLayout(5, 500, 10, 10).size >= 18, "never collapses below a readable size")

// ---- 4. Demos ---------------------------------------------------------------
for (const [name, d] of [["demo", demo], ["demo-gate", gate], ["demo-original", custom]]) {
  assert.ok(d.includes('from "@/components/ui/neon-katakana-preloader"'), `${name} imports the canonical path`)
}
assert.match(demo, /<NeonKatakanaPreloader\s+loop[\s/>]/, "default demo is the looping component, full bleed")
assert.doesNotMatch(demo, /<div/, "default demo must not wrap the component")
assert.ok(gate.includes("</NeonKatakanaPreloader>"), "gate demo passes children")

console.log("neon-katakana-preloader: ok")
