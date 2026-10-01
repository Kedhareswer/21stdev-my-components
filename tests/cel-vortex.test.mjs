// Runnable check for the clock and pointer math in components/cel-vortex, plus
// the install-safety rules the .tsx has to keep.
// Run: node tests/cel-vortex.test.mjs
//
// The vortex itself is a fragment shader and cannot be asserted here. What is
// checked is what fails silently: a held drawing that never advances (or
// advances every frame), a boil seed that repeats, a phase wrap that jumps, an
// eye that wanders off the canvas, a colour string that turns the ink black.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(new URL("../components/cel-vortex/cel-vortex.tsx", import.meta.url), "utf8")

const start = src.indexOf("// #region motion")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "motion region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*(number|string|\[number, number, number\])(?=[,)\s={])/g, "")
const { hexToRgb, drawingIndex, boilSeed, wrap, ease, idleEye } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// ---- drawings are held, "on twos" -----------------------------------------
{
  // At 12 fps a 60 Hz loop shows each drawing for five frames.
  const seen = []
  for (let f = 0; f < 60; f++) seen.push(drawingIndex(f / 60, 12, f))
  assert.equal(new Set(seen).size, 12, "one second at 12 fps is twelve drawings")
  for (let i = 1; i < seen.length; i++) assert.ok(seen[i] - seen[i - 1] <= 1, "drawings never skip at 60 Hz")
  // fps 0 means every frame is a new drawing.
  assert.notEqual(drawingIndex(0.5, 0, 30), drawingIndex(0.5, 0, 31), "smooth mode must not hold")
}

// ---- the boil changes every drawing, deterministically ---------------------
{
  const seeds = Array.from({ length: 200 }, (_, i) => boilSeed(i))
  for (const s of seeds) assert.ok(s >= 0 && s < 64, `seed out of range: ${s}`)
  for (let i = 1; i < seeds.length; i++) {
    assert.ok(Math.abs(seeds[i] - seeds[i - 1]) > 1, `consecutive drawings must boil visibly (${i})`)
  }
  assert.equal(boilSeed(17), boilSeed(17), "same drawing, same hand")
}

// ---- phase wraps are exact, both sides --------------------------------------
{
  assert.equal(wrap(257, 256), 1)
  assert.equal(wrap(-1, 256), 255)
  assert.equal(wrap(0, 256), 0)
  for (const v of [-1e4, -3.5, 0.25, 999.75, 1e6]) {
    const w = wrap(v, 256)
    assert.ok(w >= 0 && w < 256, `wrap(${v}) = ${w}`)
    assert.ok(Math.abs((((v - w) / 256) % 1)) < 1e-9 || Math.abs(Math.abs(((v - w) / 256) % 1) - 1) < 1e-9,
      "a wrap must move by whole periods only, or the rings jump")
  }
}

// The shader and the JS must agree on the wrap periods, and the ring gears
// must be whole tenths so 20π is a seamless period for every one of them.
assert.ok(/const RING_WRAP = 256\b/.test(src), "ring wrap period")
assert.ok(/mod\(ring, \$\{RING_WRAP\}\.0\)/.test(src), "the shader wraps rings by the same period")
assert.ok(/const SPIN_WRAP = Math\.PI \* 20\b/.test(src), "spin wraps at 20π")
assert.ok(/float gear = \(7\.0 \+ floor\([^;]*\) \/ 10\.0;/.test(src), "gears are whole tenths")

// ---- easing never overshoots ------------------------------------------------
{
  assert.ok(ease(0, 1, 100, 5) <= 1, "a huge step must not overshoot upward")
  assert.ok(ease(1, 0, 100, 5) >= 0, "nor downward")
  assert.equal(ease(0.4, 0.4, 1 / 60, 5), 0.4, "at the target it stays put")
  assert.equal(ease(0.2, 1, -1, 5), 0.2, "a negative dt is no step at all")
  let v = 0
  for (let i = 0; i < 120; i++) v = ease(v, 1, 1 / 60, 5)
  assert.ok(v > 0.99, `should essentially arrive in two seconds, got ${v}`)
}

// ---- the idle eye stays near the middle and never closes a loop ------------
{
  let maxR = 0
  for (let t = 0; t < 900; t += 0.1) {
    const [x, y] = idleEye(t)
    assert.ok(Number.isFinite(x) && Number.isFinite(y))
    maxR = Math.max(maxR, Math.hypot(x, y))
  }
  assert.ok(maxR < 0.1, `the idle eye wandered too far: ${maxR}`)
  assert.ok(maxR > 0.03, "but it has to visibly drift")
  let closest = Infinity
  for (let t = 0; t < 400; t += 0.37) {
    const [ax, ay] = idleEye(t)
    const [bx, by] = idleEye(t + 60)
    closest = Math.min(closest, Math.hypot(ax - bx, ay - by))
  }
  assert.ok(closest > 1e-4, "the drift must not repeat at a 60s lag")
}

// ---- colours -----------------------------------------------------------------
assert.deepEqual(hexToRgb("#ffffff"), [1, 1, 1])
assert.deepEqual(hexToRgb("#f00"), [1, 0, 0])
assert.deepEqual(hexToRgb("nope"), [0, 0, 0])
{
  const presets = src.slice(src.indexOf("export const VORTEX_PRESETS"), src.indexOf("const MAX_PULSES"))
  const defaults = src.slice(src.indexOf("export const VORTEX_DEFAULTS"), src.indexOf("export const VORTEX_PRESETS"))
  for (const [, hex] of (defaults + presets).matchAll(/Color: "([^"]+)"/g)) {
    assert.match(hex, /^#[0-9a-f]{6}$/i, `${hex} would render black`)
  }
}

// ---- install safety -----------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("canvas.clientWidth"), "the canvas measures its own box")
assert.ok(src.includes("getBoundingClientRect"), "pointer coordinates are relative to the canvas")
assert.ok(src.includes("new ResizeObserver"), "a resized box must resize the drawing buffer")

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
  'window.removeEventListener("pointerup", onUp)',
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// Reduced motion parks it on one drawing rather than merely slowing it, and a
// preset change still repaints that drawing.
assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/if \(reduced \|\| raf/.test(src), "reduced motion must never start the loop")
assert.ok(src.includes("repaintRef.current()"), "a still vortex must repaint when its params change")

// Overlay controls keep their own clicks.
assert.ok(src.includes('closest("a,button,input,textarea,select,label,[role=button]")'), "overlay clicks pass through")
// Keyboard users can surge it too.
assert.ok(/tabIndex=\{interactive \? 0 : undefined\}/.test(src), "focusable when interactive")
assert.ok(src.includes('e.key !== " "') && src.includes('e.key !== "Enter"'), "Space/Enter surge")

// The GLSL mod() trap: a float mod can return S instead of 0, tearing the seam.
assert.ok(src.includes("jj - S * floor((jj + 0.5) / S)"), "cell index must wrap without mod()")
assert.doesNotMatch(src, /mod\(jj,\s*S\)/, "no float mod on the cell index")

// Every uniform the shader declares has to be fed.
const declared = [...src.matchAll(/^uniform\s+\w+\s+u([A-Z]\w*)(?:\[[^\]]*\])?;/gm)].map((m) => m[1])
const tabled = [...src.matchAll(/\["(\w+)",\s*"[fc]"\]/g)].map((m) => m[1][0].toUpperCase() + m[1].slice(1))
const fixed = ["Res", "Dpr", "Time", "Center", "Flow", "Spin", "Surge", "SurgeOpen", "Seed", "Pulse"]
for (const name of declared) {
  assert.ok(tabled.includes(name) || fixed.includes(name), `uniform u${name} is declared but nothing uploads it`)
}
for (const name of fixed) assert.ok(src.includes(`loc("u${name}")`), `u${name} is never located`)

// Every demo wrapper around the vortex needs a width, or 21st's centring flex
// collapses it to 0px.
for (const name of ["demo.tsx", "demo-presets.tsx"]) {
  const demo = readFileSync(new URL(`../components/cel-vortex/${name}`, import.meta.url), "utf8")
  assert.ok(demo.includes('from "@/components/ui/cel-vortex"'), `${name} imports the installed path`)
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) {
    if (!/relative|overflow-hidden/.test(cls)) continue
    assert.ok(/w-(full|screen|\[|\d)/.test(cls) || /max-w-/.test(cls), `${name}: ${cls} has no width`)
  }
}

console.log("cel-vortex: ok")
