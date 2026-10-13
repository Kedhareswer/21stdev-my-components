// Install-safety and frost-seeding checks for hoarfrost-pane.
// Run: node tests/hoarfrost-pane.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/hoarfrost-pane/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("hoarfrost-pane.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|https?:\/\//, "nothing fetched")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none"), "the canvas is guarded against Preflight")
assert.ok(src.includes("hfp-fallback"), "falls back without WebGL2")
assert.ok(src.includes("EXT_color_buffer_float"), "checks for float render targets before using them")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", 'root.removeEventListener("pointermove", onMove)', "gl.deleteProgram(p.pr)", "gl.deleteTexture(t)"]) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.doesNotMatch(src, /console\.|__hfp|uDebug/, "no debug hooks ship")
assert.doesNotMatch(src.match(/const HFP_CSS = `([\s\S]*?)`/)[1], /\$\{|`/, "no interpolation in the CSS string")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
assert.doesNotMatch(src, /sin\([^)]*\) \* 43758/, "backdrop hashes are sine-free, so every GPU draws the same street")
const demo = read("demo.tsx")
assert.deepEqual([...demo.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]), ["@/components/ui/hoarfrost-pane"])

// ---- pure helpers, lifted out of the component and executed ----
const region = src.slice(src.indexOf("// #region frost"), src.indexOf("// #endregion"))
const mod = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(region)))
const { hfpRandom, hfpGrid, hfpAmbient, hfpWarmth, hfpSeed, hfpNuclei, hfpRescale, HFP_MIN_CELLS } = mod

const a = hfpRandom(5)
const b = hfpRandom(5)
for (let i = 0; i < 5; i++) assert.equal(a(), b(), "the PRNG is deterministic")

// The sim grid stays inside its cell budget on any screen, and never gets coarser than it must.
for (const [w, h] of [[320, 568], [375, 812], [1440, 900], [3840, 2160], [1, 1]]) {
  const [cell, nx, ny] = hfpGrid(w, h, 320000)
  assert.ok(cell >= 1, "cells are at least a CSS pixel at " + w + "x" + h)
  assert.ok(nx * ny <= 320000 * 1.02 || nx * ny <= 64, "over budget at " + w + "x" + h + ": " + nx * ny)
  assert.ok(nx >= 8 && ny >= 8, "grid has a floor")
}

// Cold at the frame, warming to `warm` in the middle, never colder than the frame.
const warm = hfpWarmth(0.6)
assert.equal(hfpWarmth(-1), hfpWarmth(0), "coverage clamps low")
assert.equal(hfpWarmth(9), hfpWarmth(1), "coverage clamps high")
assert.ok(hfpWarmth(0) > hfpWarmth(1), "more coverage means a colder middle")
const edge = hfpAmbient(0.5, 50, 200, 100, warm)
const mid = hfpAmbient(100, 50, 200, 100, warm)
assert.ok(edge < 0, "the frame is below freezing")
assert.ok(Math.abs(mid - warm) < 1e-9, "the middle sits at the chosen warmth")
let last = -Infinity
for (let x = 0.5; x <= 100; x += 0.5) {
  const t = hfpAmbient(x, 50, 200, 100, warm)
  assert.ok(t >= last - 1e-12, "temperature rises monotonically towards the middle")
  last = t
}

// Nucleation: inside the pane, mostly hugging the frame, reproducible.
const [nx, ny] = [300, 180]
const nuc = hfpNuclei(nx, ny, hfpRandom(11))
assert.ok(nuc.length >= 10, "enough specks to frost the frame")
for (const [x, y, th] of nuc) {
  assert.ok(x >= 0 && x <= nx && y >= 0 && y <= ny, "nucleus inside the pane")
  assert.ok(th >= 0 && th < Math.PI / 3, "lattice angle within one sixfold sector")
}
const nearFrame = nuc.filter(([x, y]) => Math.min(x, nx - x, y, ny - y) < 10).length
assert.ok(nearFrame / nuc.length > 0.8, "frost starts at the cold frame")
assert.deepEqual(hfpNuclei(nx, ny, hfpRandom(11)), nuc, "nucleation is seeded")

const state = hfpSeed(nx, ny, warm, 11)
assert.equal(state.length, nx * ny * 4)
assert.ok(state.every(Number.isFinite), "no NaN in the starting state")
assert.deepEqual(hfpSeed(nx, ny, warm, 11), state, "seeding is deterministic")
let ice = 0
for (let i = 0; i < state.length; i += 4) ice += state[i]
assert.ok(ice > 50 && ice < nx * ny * 0.05, "a scatter of seed crystals, not a sheet")
const centre = ((ny >> 1) * nx + (nx >> 1)) * 4
assert.equal(state[centre], 0, "the middle of the glass starts clear")

// A slow GPU gets a coarser sim it can finish; a fast one keeps its size; never below the floor.
assert.equal(hfpRescale(320000, 1700, 1700), 320000)
assert.ok(hfpRescale(320000, 850, 1700) < 160000)
assert.equal(hfpRescale(320000, 25, 1700), HFP_MIN_CELLS)
assert.ok(hfpRescale(320000, 0, 1700) >= HFP_MIN_CELLS)

console.log("hoarfrost-pane: ok")
