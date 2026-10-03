// Install-safety and font/timeline checks for slat-count-preloader.
// Run: node tests/slat-count-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/slat-count-preloader/", import.meta.url)
const src = readFileSync(new URL("slat-count-preloader.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const gate = readFileSync(new URL("demo-gate.tsx", dir), "utf8")
const countdown = readFileSync(new URL("demo-countdown.tsx", dir), "utf8")

// ---- 1. Install safety -----------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import — fonts come from the host or the fallback stack")
assert.doesNotMatch(src, /https?:\/\//, "no external assets")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"'), "reports progress to assistive tech")
assert.ok(src.includes("aria-valuenow={pct}"), "progressbar carries its value")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/, "effects must not depend on onComplete identity")
assert.doesNotMatch(src, /console\./, "no debug logging ships")

for (const [name, d] of [["demo", demo], ["demo-gate", gate], ["demo-countdown", countdown]]) {
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.ok(di.every((p) => p === "react" || p === "@/components/ui/slat-count-preloader"), name + ": only react and the component")
  // The SVG namespace is an identifier, not a fetch.
  for (const url of d.matchAll(/https?:\/\/[^"'\s)]+/g)) {
    assert.equal(url[0], "http://www.w3.org/2000/svg", name + ": demos fetch nothing: " + url[0])
  }
}
assert.match(demo, /<SlatCountPreloader loop \/>/, "default demo is the bare looping component")
assert.doesNotMatch(demo, /<div/, "default demo must not wrap the component")
assert.match(gate, /maxWidth: "none"/, "carousel images guard Preflight's max-width")

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const SCP_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "SCP_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.doesNotMatch(css, /\.scp-root \*/, "nothing reaches into the children the gate guards")
assert.match(css, /\.scp-gate svg \{[^}]*max-width: none/, "media overrides Preflight's max-width")

let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".scp-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(rules >= 40, `expected a full scoped sheet, saw ${rules} rules`)
for (const phase of ["exit", "hold", "done"]) {
  assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
}
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(reduced, /\.scp-slat \{[^}]*transition-delay: 0ms !important/, "slats snap under reduced motion")
assert.match(reduced, /\.scp-gate\[data-phase="exit"\] \.scp-blind \{ transform: none; \}/, "no sliding blinds under reduced motion")

// ---- 3. Font and timeline helpers, executed --------------------------------
const start = src.indexOf("// #region timeline")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "timeline region markers missing")
const js =
  "const ROWS = 7\n" +
  src
    .slice(start, end)
    .replace(/: Record<string, string\[\]>/g, "")
    .replace(/: Array<\{[^}]*\}>/g, "")
    .replace(/const out: number\[\]/g, "const out")
    .replace(/const lit: number\[\]/g, "const lit")
    .replace(/:\s*(number|string|boolean|string \| number)(?=[,)])/g, "")
const { SCP_FONT, scpRowTargets, scpLayout, scpDelay, scpSimulated, scpFormat, scpRng } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// Every glyph is 3 × 7 and only 0/1.
for (const [ch, rows] of Object.entries(SCP_FONT)) {
  assert.equal(rows.length, 7, `${ch} has seven rows`)
  for (const row of rows) assert.match(row, /^[01]{3}$/, `${ch} rows are three cells`)
}
for (const d of "0123456789") assert.ok(SCP_FONT[d], `digit ${d} is in the font`)
for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") assert.ok(SCP_FONT[c], `letter ${c} is in the font`)

// Row targets: lit bars stay, spares hide behind a lit cell, ties alternate.
assert.deepEqual(scpRowTargets("111", 0), [0, 1, 2])
assert.deepEqual(scpRowTargets("010", 0), [1, 1, 1])
assert.deepEqual(scpRowTargets("100", 0), [0, 0, 0])
assert.deepEqual(scpRowTargets("001", 3), [2, 2, 2])
assert.deepEqual(scpRowTargets("110", 0), [0, 1, 1])
assert.deepEqual(scpRowTargets("101", 0), [0, 2, 2])
assert.deepEqual(scpRowTargets("101", 1), [0, 0, 2])
assert.equal(scpRowTargets("000", 0), null)

// The rendered cells of every glyph are exactly its lit cells: no bar shows
// where the font says dark, and every lit cell is covered.
for (const [ch, rows] of Object.entries(SCP_FONT)) {
  const bars = scpLayout(ch)
  assert.equal(bars.length, 21, `${ch}: 21 bars`)
  const covered = new Set()
  bars.forEach((b, i) => {
    const r = Math.floor(i / 3) + b.dy
    assert.ok(r >= 0 && r < 7, `${ch}: bar ${i} stays on the grid`)
    if (!b.flat) covered.add(r * 3 + b.col)
  })
  const want = new Set()
  rows.forEach((row, r) => [...row].forEach((v, c) => v === "1" && want.add(r * 3 + c)))
  assert.deepEqual([...covered].sort((a, b) => a - b), [...want].sort((a, b) => a - b), `${ch}: covers exactly its lit cells`)
}
assert.ok(scpLayout(" ").every((b) => b.flat), "a space folds every bar flat")
assert.deepEqual(scpLayout("?"), scpLayout("-"), "unknown characters read as a dash")
assert.deepEqual(scpLayout("a"), scpLayout("A"), "lower case maps to the font")

// Delays follow the five-value lattice and are never all equal in a row.
const delays = Array.from({ length: 21 }, (_, i) => scpDelay(i + 1))
assert.deepEqual(delays.slice(0, 6), [69, 99, 222, 0, 99, 69])
assert.ok(delays.every((d) => [0, 69, 99, 123, 222].includes(d)))
for (let r = 0; r < 7; r++) assert.ok(new Set(delays.slice(r * 3, r * 3 + 3)).size > 1, `row ${r} does not move in lockstep`)

// Simulated load: pinned at both ends, monotonic.
assert.equal(scpSimulated(-1), 0)
assert.equal(scpSimulated(0), 0)
assert.equal(scpSimulated(1), 1)
assert.equal(scpSimulated(2), 1)
let prev = 0
for (let t = 0; t <= 1; t += 0.01) {
  const v = scpSimulated(t)
  assert.ok(v >= prev - 1e-12, `simulated load never goes backwards at t=${t.toFixed(2)}`)
  prev = v
}

// Frames.
assert.equal(scpFormat(7, 3, true), "007")
assert.equal(scpFormat(7, 3, false), "  7")
assert.equal(scpFormat(100, 3, true), "100")
assert.equal(scpFormat(-4, 3, true), "000")
assert.equal(scpFormat("go", 3, true), "GO ")
assert.equal(scpFormat("5", 3, false), " 5 ")
assert.equal(scpFormat("LOADING", 3, true), "LOADING")

// Seeded scatter replays.
const a = scpRng(42)
const b = scpRng(42)
for (let i = 0; i < 5; i++) assert.equal(a(), b())

console.log(`slat-count-preloader: ok (${rules} scoped rules, ${Object.keys(SCP_FONT).length} glyphs)`)
