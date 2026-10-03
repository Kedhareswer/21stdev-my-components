// Runnable check for the sky logic in components/dither-cumulus, plus the
// install-safety rules the .tsx has to keep.
// Run: node tests/dither-cumulus.test.mjs
//
// The clouds are a fragment shader and cannot be asserted here. What is checked
// is the part that fails silently: a cell grid that asks the GPU for a 4K
// buffer, an idle light that wanders off the sky, a fling that never stops, a
// click that reads as a drag, a colour string that turns the sky black.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(new URL("../components/dither-cumulus/dither-cumulus.tsx", import.meta.url), "utf8")

const start = src.indexOf("// #region sky")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "sky region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*(number|string|\[number, number, number\])(?=[,)\s={])/g, "")
const { hexToRgb, cellGrid, sunDrift, coast, isTap } = await import("data:text/javascript," + encodeURIComponent(js))

// ---- the cell grid -----------------------------------------------------------
{
  assert.deepEqual(cellGrid(1200, 600, 3, 1e6), [400, 200, 3], "one texel per cell")
  assert.deepEqual(cellGrid(10, 10, 0, 1e6), [10, 10, 1], "cells never shrink under a CSS px")
  assert.deepEqual(cellGrid(10, 10, NaN, 1e6), [10, 10, 1], "garbage pixel falls back to 1")
  assert.deepEqual(cellGrid(0, 0, 3, 1e6).slice(0, 2), [1, 1], "a collapsed box still gets a buffer")
  for (const [w, h, px] of [[3840, 2160, 1], [7680, 4320, 2], [2560, 1440, 1]]) {
    const [cw, ch, size] = cellGrid(w, h, px, 900_000)
    assert.ok(cw * ch <= 900_000 * 1.01, `${w}x${h}@${px}: ${cw}x${ch} is over budget`)
    assert.ok(size >= px, "budget only ever coarsens the cells")
    assert.ok(Math.abs(cw / ch - w / h) < 0.01, "cells stay square")
  }
}

// ---- the idle light stays in the upper sky ------------------------------------
for (let t = 0; t < 2000; t += 0.25) {
  const [x, y] = sunDrift(t)
  assert.ok(x >= 0.06 && x <= 0.94 && y >= 0.55 && y <= 0.95, `light left the sky at t=${t}`)
}
{
  const xs = Array.from({ length: 400 }, (_, i) => sunDrift(i)[0])
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.5, "the idle light actually travels")
}

// ---- a fling coasts, then stops ------------------------------------------------
{
  let v = 2
  let steps = 0
  while (v !== 0 && steps < 10_000) {
    const next = coast(v, 1 / 60, 2.4)
    assert.ok(Math.abs(next) < Math.abs(v), "coasting only ever slows")
    v = next
    steps++
  }
  assert.equal(v, 0, "a fling settles to exactly zero")
  assert.ok(steps > 60, "but not instantly")
  assert.equal(coast(-1, 1 / 60, 2.4) < 0, true, "direction is kept")
  assert.equal(coast(1, -5, 2.4), 1, "a backwards clock does not accelerate")
  assert.equal(coast(1, 0.1, -3), 1, "negative friction does not accelerate")
}

// ---- tap vs drag -------------------------------------------------------------
assert.equal(isTap(0, 0, 100), true)
assert.equal(isTap(3, 3, 300), true)
assert.equal(isTap(12, 0, 100), false, "a drag is not a gust")
assert.equal(isTap(0, 0, 900), false, "a long press is not a gust")

// ---- colours ---------------------------------------------------------------
assert.deepEqual(hexToRgb("#ff0000"), [1, 0, 0])
assert.deepEqual(hexToRgb("#0f0"), [0, 1, 0])
assert.deepEqual(hexToRgb("  00F  "), [0, 0, 1])
assert.deepEqual(hexToRgb("skyblue"), [0, 0, 0], "garbage is black, not NaN")
{
  const colourKeys = [...src.matchAll(/^\s{2}(\w+Color): "(#[0-9a-f]{6})",$/gm)]
  assert.equal(colourKeys.length, 6, "six default colours, each a 6-digit hex")
  for (const m of src.matchAll(/Color: "([^"]+)"/g)) assert.match(m[1], /^#[0-9a-f]{6}$/, `bad preset colour ${m[1]}`)
}

// ---- install safety ----------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("canvas.clientWidth"), "the canvas measures its own box")
assert.ok(src.includes("getBoundingClientRect"), "pointer coordinates are relative to the canvas")
assert.ok(src.includes("new ResizeObserver"), "a resized box must resize the drawing buffer")
assert.ok(src.includes("new IntersectionObserver"), "an off-screen sky must stop drawing")

assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
const root = src.slice(src.indexOf("<section"), src.indexOf("{failed ?"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")

// The buffer is one texel per cell: without these the browser blurs the pixel
// art, and Preflight's img/canvas max-width can squeeze it.
assert.ok(src.includes('imageRendering: "pixelated"'), "the cell buffer must be upscaled without smoothing")
assert.ok(src.includes('maxWidth: "none"'), "guard Preflight on the canvas")

assert.ok(src.includes("setFailed(true)") && src.includes("radial-gradient"), "needs a still fallback")
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "a dropped context must rebuild")
for (const gone of [
  "gl.deleteProgram(program)",
  "gl.deleteVertexArray(vao)",
  "observer.disconnect()",
  "io.disconnect()",
  "cancelAnimationFrame(raf)",
  'removeEventListener("pointerup", onUp)',
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/reduced \? FROZEN/.test(src), "reduced motion freezes the clock")
assert.ok(/if \(tap && !reduced\)/.test(src), "reduced motion blows no gusts")

// Overlay content must not swallow the pointer, and the sky must not swallow
// the overlay's clicks.
assert.ok(src.includes("pointer-events-none relative z-10"), "overlay passes the pointer through")
assert.ok(src.includes('closest("a,button'), "clicks on overlay controls do not start a drag")

// Every uniform the shader declares has to be fed, and every one fed must exist.
const declared = [...src.matchAll(/^uniform\s+\w+\s+u([A-Z]\w*)(\[|;)/gm)].map((m) => m[1])
const tabled = [...src.matchAll(/\["(\w+)",\s*"[fic]"\]/g)].map((m) => m[1][0].toUpperCase() + m[1].slice(1))
const fixed = ["Res", "Time", "Sun", "Look", "Travel", "Gusts"]
for (const name of declared) {
  assert.ok(tabled.includes(name) || fixed.includes(name), `uniform u${name} is declared but nothing uploads it`)
}
for (const name of fixed) assert.ok(src.includes(`loc("u${name}")`), `u${name} is never located`)
assert.ok(tabled.length > 25, `expected the parameter table to be populated, saw ${tabled.length}`)
// and every tabled key is a real parameter with a default
const defaults = src.slice(src.indexOf("CUMULUS_DEFAULTS"), src.indexOf("CUMULUS_PRESETS"))
for (const [, key] of src.matchAll(/\["(\w+)",\s*"[fic]"\]/g)) {
  assert.ok(new RegExp("^\\s+" + key + ":", "m").test(defaults), `${key} has no default`)
}

// A demo wrapper left at width:auto collapses the sky to 0px inside 21st's
// centring flex.
for (const name of ["demo.tsx", "demo-presets.tsx"]) {
  const demo = readFileSync(new URL(`../components/dither-cumulus/${name}`, import.meta.url), "utf8")
  assert.ok(demo.includes('from "@/components/ui/dither-cumulus"'), `${name} imports the installed path`)
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) {
    if (!/\brelative\b/.test(cls)) continue
    assert.ok(/w-(full|screen|\[|\d)/.test(cls) || /max-w-/.test(cls), `${name}: ${cls} has no width`)
  }
}

console.log("dither-cumulus: ok")
