// Install-safety + mesh/timing checks for cloth-peel-reveal.
// Run: node tests/cloth-peel-reveal.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/cloth-peel-reveal/", import.meta.url)
const src = readFileSync(new URL("cloth-peel-reveal.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")

assert.doesNotMatch(src, /@import/, "no @import — the host project owns fonts and Tailwind")
assert.doesNotMatch(src, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full on any root element")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")

const css = src.match(/const CPR_CSS = `([\s\S]*?)`/)
assert.ok(css, "CPR_CSS block is present")
assert.doesNotMatch(css[1], /\$\{|`/, "no backticks or interpolation inside the CSS string")
assert.match(css[1], /\.cpr-root canvas \{[^}]*max-width: none/, "canvas overrides Preflight max-width")
assert.match(css[1], /\.cpr-root canvas \{[^}]*height: 100%/, "…and its height:auto")

let ruleCount = 0
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  ruleCount++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".cpr-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(ruleCount >= 4, `expected the scope check to see real rules, saw ${ruleCount}`)

// The sheet must cover the content until the mesh is live, or a browser
// without WebGL2 flashes the page it is supposed to be hiding.
assert.match(src, /!glReady && \(/, "CSS sheet stands in until GL is ready")

// ---- self-contained, nothing borrowed --------------------------------------
const shipped = src + demo
assert.doesNotMatch(shipped, /kirifuda/i, "must not reference the site this was studied from")
const urls = [...shipped.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
assert.deepEqual(urls, [], `component and demo must make no network requests: ${urls.join(", ")}`)

// ---- the demo is the component, full bleed, nothing over it ----------------
assert.doesNotMatch(demo, /<select|<button|<label|<input/, "demo must not ship controls")
assert.doesNotMatch(demo, /\babsolute\b|\bfixed\b|z-\[/, "demo must not overlay anything")
assert.match(
  demo.replace(/\s+/g, " "),
  /return \( <ClothPeelReveal/,
  "the component is the demo's root, not wrapped in a container",
)

// ---- runnable logic --------------------------------------------------------
const region = src.match(/\/\/ #region progress([\s\S]*?)\/\/ #endregion/)
assert.ok(region, "progress region is present")
const js = region[1]
  .replace(/: ?\[number, number, number\]/g, "")
  .replace(/\): \{[^}]*\} \{/g, ") {")
  .replace(/: ?number/g, "")
  .replace(/: ?string/g, "")
const { peelEase, loopPhase, parseHex, buildGrid } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

assert.equal(peelEase(0), 0, "starts settled")
assert.equal(peelEase(1), 1, "ends gone")
assert.equal(peelEase(-4), 0, "clamps below 0")
assert.equal(peelEase(7), 1, "clamps above 1")

let prev = -1
for (let i = 0; i <= 500; i++) {
  const v = peelEase(i / 500)
  assert.ok(v >= prev - 1e-9, `peel reversed at t=${i / 500}: ${prev} -> ${v}`)
  prev = v
}

const D = 1200, H = 600
assert.equal(loopPhase(0, D, H).stage, "peeling")
assert.equal(loopPhase(D + 5, D, H).stage, "gone")
assert.equal(loopPhase(D + H + 5, D, H).stage, "returning")
assert.equal(loopPhase(D * 2 + H + 5, D, H).stage, "settled")
assert.equal(loopPhase(D + 1, D, H).progress, 1, "fully gone during the gone hold")
assert.equal(loopPhase(D * 2 + H + 1, D, H).progress, 0, "fully settled during the settled hold")
const cycle = D * 2 + H * 2
assert.ok(
  Math.abs(loopPhase(cycle - 1, D, H).progress - loopPhase(0, D, H).progress) < 0.01,
  "loop wraps without the sheet popping",
)

assert.deepEqual(parseHex("#ffffff"), [1, 1, 1], "white")
assert.deepEqual(parseHex("#fff"), [1, 1, 1], "shorthand expands")
assert.deepEqual(parseHex("bogus"), [0, 0, 0], "garbage falls back to black, never NaN")

// The mesh is the effect. A bad index silently corrupts the sheet rather than
// throwing, so check the topology rather than trusting it.
const g = buildGrid(6, 4)
assert.equal(g.vertexCount, 7 * 5, "vertex count is (cols+1)(rows+1)")
assert.equal(g.indexCount, 6 * 4 * 6, "two triangles per quad")
assert.equal(g.uvs.length, g.vertexCount * 2, "two floats per vertex")
for (const i of g.indices) {
  assert.ok(Number.isInteger(i) && i >= 0 && i < g.vertexCount, `index ${i} is out of range`)
}
for (const v of g.uvs) assert.ok(v >= 0 && v <= 1, `uv ${v} left the unit square`)
// Every vertex must be referenced, or part of the sheet is never drawn.
assert.equal(new Set(g.indices).size, g.vertexCount, "every vertex is used by some triangle")

// The production grid must stay addressable by the Uint16 index buffer it uses.
const big = buildGrid(120, 80)
assert.ok(big.vertexCount <= 65536, `grid of ${big.vertexCount} verts overflows a Uint16 index`)
assert.ok(big.indices instanceof Uint16Array, "indices are Uint16, matching UNSIGNED_SHORT")

console.log("cloth-peel-reveal: ok")
