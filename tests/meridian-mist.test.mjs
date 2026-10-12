// Runnable check for the drafting helpers in components/meridian-mist, plus
// the install-safety rules the .tsx has to keep.
// Run: node tests/meridian-mist.test.mjs
//
// The mist itself is a fragment shader and cannot be asserted here. What is
// checked is the part that fails silently: a crosshair that snaps to the wrong
// guide (or off the sheet), circles that leave the box, guide lists that send
// NaN to a uniform, a colour string that turns the sheet black.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(new URL("../components/meridian-mist/meridian-mist.tsx", import.meta.url), "utf8")

const start = src.indexOf("// #region drafting")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "drafting region markers missing")

const js = src
  .slice(start, end)
  .replace(/\): \[number, number, number\] \{/g, ") {")
  .replace(/const out: \[number, number, number\]\[\] = /g, "const out = ")
  .replace(/:\s*(number\[\]|\[number, number, number\]\[\]|number|string)(?=[,)\s={])/g, "")
const { hexToRgb, grainFrame, cleanGuides, circleLayout, snapPoint } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// ---- grain runs on its own clock --------------------------------------------
{
  const frames = new Set()
  for (let i = 0; i < 120; i++) frames.add(grainFrame(i / 120, 18))
  assert.equal(frames.size, 18, "one second at 18 fps is 18 distinct grain frames")
  assert.equal(grainFrame(5, 0), 0, "fps 0 prints the grain still")
  assert.equal(grainFrame(NaN, 24), 0, "a bad clock is a still frame, not NaN in a uniform")
  for (const t of [0, 1e3, 1e5, 1e7]) assert.ok(grainFrame(t, 60) < 4096, `frame index unbounded at t=${t}`)
}

// ---- guide lists are safe to upload --------------------------------------------
assert.deepEqual(cleanGuides([0.5, -1, 2, NaN, Infinity, "x"]), [0.5, 0, 1])
assert.equal(cleanGuides(Array.from({ length: 20 }, (_, i) => i / 20)).length, 8, "the shader holds eight per axis")
assert.deepEqual(cleanGuides(undefined), [], "a missing list is no guides, not a crash")

// ---- circles ---------------------------------------------------------------
{
  // Portrait, like the reference: two circles stacked vertically, one radius apart.
  const portrait = circleLayout(736, 1308, 2, 0.453, 1)
  assert.equal(portrait.length, 2)
  for (const [x] of portrait) assert.equal(x, 368, "portrait circles share the vertical axis")
  const r = portrait[0][2]
  assert.ok(Math.abs(r - 736 * 0.453) < 1e-9, "radius is a fraction of the short side")
  assert.ok(Math.abs(portrait[1][1] - portrait[0][1] - r) < 1e-9, "gap is measured in radii")
  assert.ok(Math.abs((portrait[0][1] + portrait[1][1]) / 2 - 654) < 1e-9, "the pair is centred")
  // Landscape: side by side, and still inside the box.
  const land = circleLayout(1440, 900, 2, 0.453, 1)
  assert.equal(land[0][1], 450)
  assert.ok(land[0][0] < land[1][0], "landscape circles lay out along the width")
  for (const [x, , rr] of land) assert.ok(x - rr >= 0 && x + rr <= 1440, "a default circle leaves the box")
  assert.equal(circleLayout(800, 600, 9, 0.4, 1).length, 3, "at most three circles")
  assert.equal(circleLayout(800, 600, -2, 0.4, 1).length, 0)
  assert.equal(circleLayout(800, 600, NaN, 0.4, 1).length, 0)
  assert.equal(circleLayout(800, 600, 1, 0.4, 1)[0][0], 400, "one circle sits dead centre")
}

// ---- the crosshair snaps -------------------------------------------------------
{
  const cols = [100, 300]
  const rows = [50, 400]
  const circles = [[600, 300, 100]]
  assert.deepEqual(snapPoint(108, 200, cols, rows, circles, 14), [100, 200, 0, -1, -1], "snaps to a column")
  assert.deepEqual(snapPoint(220, 390, cols, rows, circles, 14), [220, 400, -1, 1, -1], "snaps to a row")
  assert.deepEqual(snapPoint(296, 55, cols, rows, circles, 14), [300, 50, 1, 0, -1], "lands on the crossing")
  assert.deepEqual(snapPoint(200, 200, cols, rows, circles, 14), [200, 200, -1, -1, -1], "free space stays free")
  // The nearer of two close guides wins.
  assert.equal(snapPoint(105, 0, [100, 110], [], [], 14)[2], 1)
  // Onto the circle: projected to the outline, never inside it.
  const [x, y, c, r, k] = snapPoint(710, 300, cols, rows, circles, 14)
  assert.deepEqual([x, y, c, r, k], [700, 300, -1, -1, 0])
  const [dx, dy] = snapPoint(600 + 70, 300 + 72, [], [], circles, 14)
  assert.ok(Math.abs(Math.hypot(dx - 600, dy - 300) - 100) < 1e-9, "a circle snap lands on the outline")
  // A line beats a circle under the same pointer.
  assert.equal(snapPoint(300, 300, [300], [], [[300, 200, 100]], 14)[4], -1)
  // The centre of a circle has no direction to project along.
  assert.deepEqual(snapPoint(600, 300, [], [], circles, 200), [600, 300, -1, -1, -1])
  // Snap off.
  assert.deepEqual(snapPoint(101, 51, cols, rows, circles, 0), [101, 51, -1, -1, -1])
}

// ---- colours ---------------------------------------------------------------
assert.deepEqual(hexToRgb("#ff0000"), [1, 0, 0])
assert.deepEqual(hexToRgb("#0f0"), [0, 1, 0])
assert.deepEqual(hexToRgb("tomato"), [0, 0, 0], "garbage is black, not NaN")
{
  const defaults = src.slice(src.indexOf("export const MIST_DEFAULTS"), src.indexOf("export const MIST_PRESETS"))
  assert.equal([...defaults.matchAll(/^\s{2}(\w+Color): "(#[0-9a-f]{6})",$/gm)].length, 8, "eight default colours")
  for (const m of src.matchAll(/(\w+Color): "([^"]*)"/g)) assert.match(m[2], /^#[0-9a-f]{6}$/, `${m[1]} is not a hex`)
}

// ---- install safety ----------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /<style/, "no stylesheet: everything is inline style or Tailwind")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("canvas.clientWidth"), "the canvas measures its own box")
assert.ok(src.includes("getBoundingClientRect"), "pointer coordinates are relative to the canvas")
assert.ok(src.includes("new ResizeObserver"), "a resized box must resize the drawing buffer")
assert.ok(src.includes("new IntersectionObserver"), "an off-screen sheet must stop drawing")

assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
const root = src.slice(src.lastIndexOf("<section"), src.indexOf("{failed ?"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")
assert.ok(root.includes("style={{ height"), "the root takes the height prop")

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
assert.ok(/if \(reduced\) paint\(\)/.test(src), "with the loop off, the pointer still repaints")

// Overlay content and the readout must not swallow the pointer, and the mist
// must not swallow the overlay's clicks.
assert.ok(src.includes("pointer-events-none relative z-10"), "overlay passes the pointer through")
assert.ok(/pointer-events-none absolute left-0 top-0/.test(src), "the readout passes the pointer through")
assert.ok(src.includes('closest("a,button'), "clicks on overlay controls do not drop a ring")

// Every uniform the shader declares has to be fed, and every one fed must exist.
const declared = [...src.matchAll(/^uniform\s+\w+\s+u([A-Z]\w*)(\[|;)/gm)].map((m) => m[1])
const tabled = [...src.matchAll(/\["(\w+)",\s*"[fc]"\]/g)].map((m) => m[1][0].toUpperCase() + m[1].slice(1))
const fixed = [
  "Res", "Dpr", "Time", "Wall", "Frame", "Lamp", "LampOn", "Cursor", "CursorOn",
  "Cols", "ColGlow", "ColCount", "Rows", "RowGlow", "RowCount", "Circles", "CircleGlow", "CircleCount", "Ripple",
]
for (const name of declared) {
  assert.ok(tabled.includes(name) || fixed.includes(name), `uniform u${name} is declared but nothing uploads it`)
}
for (const name of fixed) assert.ok(src.includes(`loc("u${name}")`), `u${name} is never located`)
const defaults = src.slice(src.indexOf("export const MIST_DEFAULTS"), src.indexOf("export const MIST_PRESETS"))
for (const name of tabled) {
  const key = name[0].toLowerCase() + name.slice(1)
  assert.ok(new RegExp("\\b" + key + ":").test(defaults), `${key} is uploaded but has no default`)
}

// Demos import the installed path, and a relative wrapper always has a width.
for (const name of ["demo.tsx", "demo-studio.tsx"]) {
  const demo = readFileSync(new URL(`../components/meridian-mist/${name}`, import.meta.url), "utf8")
  assert.match(demo, /from "@\/components\/ui\/meridian-mist"/, `${name} imports the installed path`)
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) {
    if (!/\brelative\b/.test(cls)) continue
    assert.ok(/w-(full|screen|\[|\d)/.test(cls) || /max-w-/.test(cls), `${name}: ${cls} has no width`)
  }
}
// Controls in the studio demo opt back into the pointer.
assert.match(
  readFileSync(new URL("../components/meridian-mist/demo-studio.tsx", import.meta.url), "utf8"),
  /pointer-events-auto/,
)

console.log("meridian-mist: ok")
