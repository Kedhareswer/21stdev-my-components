// Install-safety and logic checks for components/pigment-experience-ledger.
// Run: node tests/pigment-experience-ledger.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "pigment-experience-ledger"
const read = (f) => readFileSync(new URL(`../components/${SLUG}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|https?:\/\//, "nothing loads at runtime: the pigment is painted")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /minHeight = "100svh"/, "explicit default height")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|React\.[A-Za-z]+</, "no generics before the JSX (21st CLI tokenizer)")
assert.match(src, /prefers-reduced-motion/, "reduced motion is honoured")
assert.match(src, /aria-expanded=\{isOpen\}/, "rows are real disclosure buttons")
assert.match(src, /aria-controls=\{panelId\}/, "each button names its panel")
assert.match(src, /role="region"/, "open rows are labelled regions")
assert.match(src, /IntersectionObserver/, "the pigment sleeps off screen")
assert.match(src, /visibilitychange/, "and in background tabs")
assert.doesNotMatch(src, /getContext\("webgl/, "2D canvas only: same cost on a software renderer")
assert.match(src, /hover:hover\) and \(pointer:fine/, "hover motion is gated to real pointers")
assert.match(src, /it\.colors \?\? section/, "a row's own colours override the section's")
assert.match(src, /aria-label=\{L\.tags\}/, "the tag list's name is a prop, not hard-coded")
assert.match(src, /elsewhere \? 0\.3 : 1/, "one focal point: the open row steps back")
{
  const css = src.match(/const PEL_CSS = \[([\s\S]*?)\]\.join/)[1]
  assert.doesNotMatch(css, /\$\{|`|(^|[\s"}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /\.pel-root\{[^}]*width:100%/, "the root claims full width")
  assert.match(css, /\.pel-ink\{[^}]*max-width:none/, "the canvas is guarded against Preflight")
  assert.match(css, /focus-visible/, "visible keyboard focus")
  assert.match(css, /@container \(max-width:640px\)/, "a designed narrow layout")
}
for (const demo of ["demo.tsx", "demo-tide.tsx"]) {
  const d = read(demo)
  assert.match(d, /from "@\/components\/ui\/pigment-experience-ledger"/, demo + " imports the installed path")
  assert.doesNotMatch(d, /https?:\/\//, demo + " is self-contained, so 21st can capture it")
  assert.match(d, /export default function [A-Z]/, demo + " default-exports a capitalised function")
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

// one row open at a time; opening the open row closes it
assert.equal(L.nextOpen(null, 2), 2)
assert.equal(L.nextOpen(2, 2), null)
assert.equal(L.nextOpen(2, 0), 0)

// wordmarks shrink to fit, never grow, never below the floor
assert.equal(L.fitFont(96, 500, 800), 96)
assert.equal(L.fitFont(96, 1000, 500), 48)
assert.equal(L.fitFont(96, 10000, 100), 18)
assert.ok(L.fitFont(96, 999, 500) * 999 / 96 <= 500, "a fitted wordmark never overflows")

// colour helpers
assert.deepEqual(L.hexToRgb("#ff7417"), [255, 116, 23])
assert.deepEqual(L.hexToRgb("#fff"), [255, 255, 255])
assert.deepEqual(L.rampAt([0, 0, 0], [100, 100, 100], [200, 200, 200], 0), [0, 0, 0])
assert.deepEqual(L.rampAt([0, 0, 0], [100, 100, 100], [200, 200, 200], 0.5), [100, 100, 100])
assert.deepEqual(L.rampAt([0, 0, 0], [100, 100, 100], [200, 200, 200], 1), [200, 200, 200])
assert.ok(L.luminance(255, 255, 255) > 0.99 && L.luminance(0, 0, 0) === 0)
for (const [name, stops] of Object.entries(L.PALETTES)) assert.equal(stops.length, 3, name + " has core, body, edge")

// noise is deterministic and bounded, so the paper texture never flickers
for (let i = 0; i < 200; i++) {
  const v = L.valueNoise(i * 0.37, i * 0.91, 5)
  assert.ok(v >= 0 && v <= 1)
  assert.equal(v, L.valueNoise(i * 0.37, i * 0.91, 5))
}
assert.equal(L.smoothstep(0, 1, -1), 0)
assert.equal(L.smoothstep(0, 1, 2), 1)

console.log("pigment-experience-ledger: ok")
