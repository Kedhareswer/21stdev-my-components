// Runnable check for the sky layout in components/halftone-nebula, plus the
// install-safety rules the .tsx has to keep.
// Run: node tests/halftone-nebula.test.mjs
//
// The nebula itself is a fragment shader and cannot be asserted here. What is
// checked is the part that fails silently: a seed that stops being
// deterministic, sparkles hung off-canvas or piled into one knot, a click that
// evicts the hero star, a colour string that turns the sky black.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/halftone-nebula/halftone-nebula.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region sky")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "sky region markers missing")

const js =
  "const MAX_SPARKS = 16\n" +
  src
    .slice(start, end)
    .replace(/:\s*(Sparkle\[\]|Sparkle|number|string|\[number, number, number\])(?=[,)\s={])/g, "")
const { mulberry32, layoutSparkles, pushSparkle, hexToRgb, driftPos } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// ---- the seed is the sky ---------------------------------------------------
{
  const a = mulberry32(42), b = mulberry32(42), c = mulberry32(43)
  const sa = Array.from({ length: 20 }, a)
  assert.deepEqual(sa, Array.from({ length: 20 }, b), "same seed, same sequence")
  assert.notDeepEqual(sa, Array.from({ length: 20 }, c), "different seed, different sequence")
  for (const v of sa) assert.ok(v >= 0 && v < 1, `out of range: ${v}`)
  assert.deepEqual(layoutSparkles(11, 9), layoutSparkles(11, 9), "layout must be deterministic")
}

// ---- sparkles stay on the canvas and apart --------------------------------
for (let seed = 0; seed < 200; seed++) {
  const sky = layoutSparkles(seed, 9)
  assert.equal(sky.length, 9)
  const [hero, pale, ...rest] = sky
  assert.ok(hero.y >= 0.58 && hero.reach > Math.max(...rest.map((s) => s.reach)), `seed ${seed}: the hero leads`)
  assert.equal(pale.tint, 1, "the second star is the pale one")
  for (const s of sky) {
    assert.ok(s.x >= 0.08 && s.x <= 0.92 && s.y >= 0.08 && s.y <= 0.92, `seed ${seed}: off canvas`)
    assert.ok(s.core > 0 && s.core < s.reach, "a core larger than its spikes reads as a blob")
    assert.equal(s.user, false)
  }
  // Rejection sampling can give up on a crowded sky, but the hero's spikes
  // must never be buried under another star's core.
  for (const s of rest) assert.ok(Math.hypot(s.x - hero.x, s.y - hero.y) > 0.05, `seed ${seed}: knot at the hero`)
}
assert.equal(layoutSparkles(1, 0).length, 0, "zero sparkles is a valid sky")
assert.equal(layoutSparkles(1, 99).length, 16, "never more than the shader can hold")
assert.equal(layoutSparkles(1, -3).length, 0, "negative counts clamp to empty")

// ---- clicks never evict the seeded sky ---------------------------------------
{
  let sky = layoutSparkles(7, 9)
  const click = (i) => ({ x: 0.5, y: 0.5, reach: 0.05, core: 0.01, tint: 0, phase: i, born: i, user: true })
  for (let i = 0; i < 40; i++) sky = pushSparkle(sky, click(i))
  assert.equal(sky.length, 16, "capped at the uniform array size")
  assert.equal(sky.filter((s) => !s.user).length, 9, "seeded stars survive any number of clicks")
  const users = sky.filter((s) => s.user).map((s) => s.phase)
  assert.deepEqual(users, [33, 34, 35, 36, 37, 38, 39], "the oldest user star makes room")
  const full = layoutSparkles(3, 16)
  assert.equal(pushSparkle(full, click(0)), full, "a sky full of seeded stars ignores clicks")
}

// ---- colours ---------------------------------------------------------------
assert.deepEqual(hexToRgb("#ff0000"), [1, 0, 0])
assert.deepEqual(hexToRgb("#0f0"), [0, 1, 0])
assert.deepEqual(hexToRgb("  00F  "), [0, 0, 1])
assert.deepEqual(hexToRgb("tomato"), [0, 0, 0], "garbage is black, not NaN")
{
  const colourKeys = [...src.matchAll(/^\s{2}(\w+Color): "(#[0-9a-f]{6})",$/gm)]
  assert.ok(colourKeys.length >= 7, "every default colour is a 6-digit hex")
}

// ---- the idle lamp stays in the frame ----------------------------------------
for (let t = 0; t < 900; t += 0.1) {
  const [x, y] = driftPos(t)
  assert.ok(x >= 0.05 && x <= 0.95 && y >= 0.05 && y <= 0.95, `lamp left the sky at t=${t}`)
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

assert.ok(src.includes("setFailed(true)") && src.includes("radial-gradient"), "needs a still fallback")
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "a dropped context must rebuild")
for (const gone of [
  "gl.deleteProgram(program)",
  "gl.deleteVertexArray(vao)",
  "observer.disconnect()",
  "io.disconnect()",
  "cancelAnimationFrame(raf)",
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/reduced \? FROZEN/.test(src), "reduced motion freezes the clock")

// Overlay content must not swallow the pointer, and the sky must not swallow
// the overlay's clicks.
assert.ok(src.includes("pointer-events-none relative z-10"), "overlay passes the pointer through")
assert.ok(src.includes('closest("a,button'), "clicks on overlay controls do not spawn stars")

// Every uniform the shader declares has to be fed, and every one fed must exist.
const declared = [...src.matchAll(/^uniform\s+\w+\s+u([A-Z]\w*)(\[|;)/gm)].map((m) => m[1])
const tabled = [...src.matchAll(/\["(\w+)",\s*"[fibc]"\]/g)].map((m) => m[1][0].toUpperCase() + m[1].slice(1))
const fixed = ["Res", "Dpr", "Time", "Pointer", "PointerOn", "Look", "SparkCount", "Spark", "SparkB", "Ripple", "Planet"]
for (const name of declared) {
  assert.ok(tabled.includes(name) || fixed.includes(name), `uniform u${name} is declared but nothing uploads it`)
}
for (const name of fixed) assert.ok(src.includes(`loc("u${name}")`), `u${name} is never located`)
assert.ok(tabled.length > 25, `expected the parameter table to be populated, saw ${tabled.length}`)

// A demo wrapper left at width:auto collapses the sky to 0px inside 21st's
// centring flex.
for (const name of ["demo.tsx", "demo-presets.tsx"]) {
  const demo = readFileSync(new URL(`../components/halftone-nebula/${name}`, import.meta.url), "utf8")
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) {
    if (!/\brelative\b/.test(cls)) continue
    assert.ok(/w-(full|screen|\[|\d)/.test(cls) || /max-w-/.test(cls), `${name}: ${cls} has no width`)
  }
}

console.log("halftone-nebula: ok")
