// Install-safety + tear-timing checks for noise-dissolve-reveal.
// Run: node tests/noise-dissolve-reveal.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/noise-dissolve-reveal/", import.meta.url)
const src = readFileSync(new URL("noise-dissolve-reveal.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")

assert.doesNotMatch(src, /@import/, "no @import — the host project owns fonts and Tailwind")
assert.doesNotMatch(src, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full on any root element")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")

const css = src.match(/const NDR_CSS = `([\s\S]*?)`/)
assert.ok(css, "NDR_CSS block is present")
assert.doesNotMatch(css[1], /\$\{|`/, "no backticks or interpolation inside the CSS string")

// Preflight sets height:auto / max-width:100% on canvas, which collapses it
// inside an absolutely-positioned parent.
assert.match(css[1], /\.ndr-root canvas \{[^}]*max-width: none/, "canvas overrides Preflight max-width")
assert.match(css[1], /\.ndr-root canvas \{[^}]*height: 100%/, "…and its height:auto")

let ruleCount = 0
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  ruleCount++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".ndr-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(ruleCount >= 4, `expected the scope check to see real rules, saw ${ruleCount}`)

// The veil must cover the content until the shader is actually live, or a
// browser without WebGL2 flashes the page it is supposed to be hiding.
assert.match(src, /!glReady && <div className="ndr-veil"/, "CSS veil stands in until GL is ready")

// ---- fully self-contained, no third-party anything -------------------------
// The effect is procedural; it must not fetch or reproduce anyone's assets.
const shipped = src + demo
assert.doesNotMatch(shipped, /kirifuda/i, "must not reference the site this was studied from")
const urls = [...shipped.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
assert.deepEqual(urls, [], `component and demo must make no network requests: ${urls.join(", ")}`)

// ---- the demo is the component, full bleed, nothing else -------------------
assert.doesNotMatch(demo, /<select|<input|<button|<label/, "demo must not ship controls")
assert.doesNotMatch(demo, /absolute|fixed|z-\[/, "demo must not overlay anything on the component")
assert.ok(demo.includes("<NoiseDissolveReveal"), "demo renders the component")

// ---- tear timing (lifted from the #region block) ---------------------------
const region = src.match(/\/\/ #region progress([\s\S]*?)\/\/ #endregion/)
assert.ok(region, "progress region is present")
const js = region[1]
  .replace(/: ?\[number, number, number\]/g, "")
  .replace(/\): \{[^}]*\} \{/g, ") {")
  .replace(/: ?number/g, "")
  .replace(/: ?string/g, "")
const { tearEase, loopPhase, parseHex } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

assert.equal(tearEase(0), 0, "starts closed")
assert.equal(tearEase(1), 1, "ends fully torn")
assert.equal(tearEase(-3), 0, "clamps below 0")
assert.equal(tearEase(9), 1, "clamps above 1")

// Monotonic: the veil must never re-seal mid-tear.
let prev = -1
for (let i = 0; i <= 500; i++) {
  const v = tearEase(i / 500)
  assert.ok(v >= prev - 1e-9, `tear reversed at t=${i / 500}: ${prev} -> ${v}`)
  assert.ok(v >= 0 && v <= 1, `tear left 0..1 at t=${i / 500}: ${v}`)
  prev = v
}

// Loop: open, hold, seal, hold — and the ends must meet, or the loop jumps.
const D = 1000, H = 500
assert.equal(loopPhase(0, D, H).stage, "opening")
assert.equal(loopPhase(D + 10, D, H).stage, "open")
assert.equal(loopPhase(D + H + 10, D, H).stage, "sealing")
assert.equal(loopPhase(D * 2 + H + 10, D, H).stage, "sealed")
assert.equal(loopPhase(D + 1, D, H).progress, 1, "fully open during the open hold")
assert.equal(loopPhase(D * 2 + H + 1, D, H).progress, 0, "fully sealed during the sealed hold")

// The cycle must be continuous where it wraps, or the veil pops.
const cycle = D * 2 + H * 2
assert.ok(
  Math.abs(loopPhase(cycle - 1, D, H).progress - loopPhase(0, D, H).progress) < 0.01,
  "loop wraps without a jump",
)

assert.deepEqual(parseHex("#000000"), [0, 0, 0], "black")
assert.deepEqual(parseHex("#ffffff"), [1, 1, 1], "white")
assert.deepEqual(parseHex("#fff"), [1, 1, 1], "shorthand expands")
assert.deepEqual(parseHex("nonsense"), [0, 0, 0], "garbage falls back to black, never NaN")
for (const v of parseHex("#3A7BD5")) assert.ok(Number.isFinite(v) && v >= 0 && v <= 1, "channels in 0..1")

console.log("noise-dissolve-reveal: ok")
