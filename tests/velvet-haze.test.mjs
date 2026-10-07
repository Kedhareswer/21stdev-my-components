// Runnable check for the film/pointer helpers in components/velvet-haze, plus
// the install-safety rules the .tsx has to keep.
// Run: node tests/velvet-haze.test.mjs
//
// The haze itself is a fragment shader and cannot be asserted here. What is
// checked is the part that fails silently: grain that re-rolls at the display
// rate (or never), a cast shadow that swings the wrong way, an idle lamp that
// wanders off the frame, a colour string that turns the light black.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(new URL("../components/velvet-haze/velvet-haze.tsx", import.meta.url), "utf8")

const start = src.indexOf("// #region film")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "film region markers missing")

const js = src.slice(start, end).replace(/:\s*(number|string|\[number, number, number\])(?=[,)\s={])/g, "")
const { hexToRgb, grainFrame, driftPos, castOffset } = await import("data:text/javascript," + encodeURIComponent(js))

// ---- grain runs on its own clock --------------------------------------------
{
  // 24 fps: a 120 Hz display draws five frames per grain frame.
  const frames = new Set()
  for (let i = 0; i < 120; i++) frames.add(grainFrame(i / 120, 24))
  assert.equal(frames.size, 24, "one second at 24 fps is 24 distinct grain frames")
  assert.equal(grainFrame(0.02, 24), grainFrame(0.03, 24), "grain holds between its frames")
  assert.equal(grainFrame(5, 0), 0, "fps 0 freezes the grain")
  assert.equal(grainFrame(5, -3), 0, "negative fps freezes, never goes backwards")
  assert.equal(grainFrame(NaN, 24), 0, "a bad clock is a still frame, not NaN in a uniform")
  assert.equal(grainFrame(1, 10000), 120, "fps is capped")
  // The frame index is a hash seed; it must stay small enough for float32.
  for (const t of [0, 1e3, 1e5, 1e7]) assert.ok(grainFrame(t, 60) < 4096, `frame index unbounded at t=${t}`)
}

// ---- the cast shadow falls away from the light ------------------------------
{
  const [lx] = castOffset(0.1, 0.5, 40)
  const [rx] = castOffset(0.9, 0.5, 40)
  assert.ok(lx > 0 && rx < 0, "light on the left throws the shadow right, and vice versa")
  const [, top] = castOffset(0.5, 0, 40)
  const [, bottom] = castOffset(0.5, 1, 40)
  assert.ok(top > bottom, "light from above pushes the shadow further down")
  for (let x = 0; x <= 1; x += 0.1)
    for (let y = 0; y <= 1; y += 0.1) {
      const [dx, dy] = castOffset(x, y, 40)
      assert.ok(dy > 0, "a card lit from in front always casts somewhat downward")
      assert.ok(Math.abs(dx) <= 20 && dy <= 40, "the shadow stays under the card")
    }
  assert.deepEqual(castOffset(-5, 9, 40), castOffset(0, 1, 40), "out-of-range lamps clamp")
}

// ---- the idle lamp stays in the frame ----------------------------------------
for (let t = 0; t < 900; t += 0.1) {
  const [x, y] = driftPos(t)
  assert.ok(x >= 0.08 && x <= 0.92 && y >= 0.08 && y <= 0.92, `lamp left the frame at t=${t}`)
}

// ---- colours ---------------------------------------------------------------
assert.deepEqual(hexToRgb("#ff0000"), [1, 0, 0])
assert.deepEqual(hexToRgb("#0f0"), [0, 1, 0])
assert.deepEqual(hexToRgb("  00F  "), [0, 0, 1])
assert.deepEqual(hexToRgb("tomato"), [0, 0, 0], "garbage is black, not NaN")
{
  const colourKeys = [...src.matchAll(/^\s{2}(\w+Color): "(#[0-9a-f]{6})",$/gm)]
  assert.equal(colourKeys.length, 6, "every default colour is a 6-digit hex")
  for (const m of src.matchAll(/(\w+Color): "([^"]*)"/g)) assert.match(m[2], /^#[0-9a-f]{6}$/, `${m[1]} is not a hex`)
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
assert.ok(src.includes("new IntersectionObserver"), "an off-screen haze must stop drawing")

assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
const jsx = src.slice(src.lastIndexOf("  return ("))
assert.doesNotMatch(jsx.slice(0, jsx.indexOf("{cast > 0")), /\bh-(full|screen)\b/, "no percentage height on the wrapper")
const section = jsx.slice(jsx.indexOf("<section"), jsx.indexOf("{failed ?"))
assert.doesNotMatch(section, /\bh-(full|screen)\b/, "no percentage height on the frame")
assert.ok(section.includes("style={{ height"), "the frame takes the height prop")

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
assert.ok(src.includes("motion-reduce:transition-none"), "the cast shadow does not ease under reduced motion")

// The cast shadow lives outside the clipped frame, behind it, and is moved
// with transforms only — never layout.
assert.ok(/className=\{"relative isolate w-full /.test(src), "wrapper isolates the -z-10 shadow layers")
assert.ok((src.match(/-z-10/g) ?? []).length === 2, "shadow and glow sit behind the frame")
assert.doesNotMatch(src.slice(src.indexOf("const placeCast"), src.indexOf("// ---- one frame")), /style\.(top|left|width|height|margin|boxShadow)/, "cast moves by transform, not layout")

// Overlay content must not swallow the pointer, and the haze must not swallow
// the overlay's clicks.
assert.ok(src.includes("pointer-events-none relative z-10"), "overlay passes the pointer through")
assert.ok(src.includes('closest("a,button'), "clicks on overlay controls do not send a ring")

// Every uniform the shader declares has to be fed, and every one fed must exist.
const declared = [...src.matchAll(/^uniform\s+\w+\s+u([A-Z]\w*)(\[|;)/gm)].map((m) => m[1])
const tabled = [...src.matchAll(/\["(\w+)",\s*"[fc]"\]/g)].map((m) => m[1][0].toUpperCase() + m[1].slice(1))
const fixed = ["Res", "Dpr", "Time", "Frame", "Lamp", "LampOn", "Smear", "Ripple"]
for (const name of declared) {
  assert.ok(tabled.includes(name) || fixed.includes(name), `uniform u${name} is declared but nothing uploads it`)
}
for (const name of fixed) assert.ok(src.includes(`loc("u${name}")`), `u${name} is never located`)
assert.ok(tabled.length >= 20, `expected the parameter table to be populated, saw ${tabled.length}`)
// Every tabled key must be a real parameter with a default.
const defaults = src.slice(src.indexOf("export const HAZE_DEFAULTS"), src.indexOf("export const HAZE_PRESETS"))
for (const name of tabled) {
  const key = name[0].toLowerCase() + name.slice(1)
  assert.ok(new RegExp("\\b" + key + ":").test(defaults), `${key} is uploaded but has no default`)
}
// No stylesheet at all, so there is no CSS string for backticks or ${ to leak
// into — the shader's own interpolations never reach CSS.
assert.doesNotMatch(src, /<style/, "no stylesheet: everything is inline style or Tailwind")

// A demo wrapper left at width:auto collapses the haze to 0px inside 21st's
// centring flex.
for (const name of ["demo.tsx", "demo-full.tsx", "demo-presets.tsx"]) {
  const demo = readFileSync(new URL(`../components/velvet-haze/${name}`, import.meta.url), "utf8")
  assert.match(demo, /from "@\/components\/ui\/velvet-haze"/, `${name} imports the installed path`)
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) {
    if (!/\brelative\b/.test(cls)) continue
    assert.ok(/w-(full|screen|\[|\d)/.test(cls) || /max-w-/.test(cls), `${name}: ${cls} has no width`)
  }
}

console.log("velvet-haze: ok")
