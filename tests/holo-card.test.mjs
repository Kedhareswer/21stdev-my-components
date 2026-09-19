// Runnable check for the tilt/view/parallax math in components/holo-card, plus
// the install-safety rules the .tsx has to keep.
// Run: node tests/holo-card.test.mjs
//
// The foil is a shader and cannot be asserted here. What can is the small
// chain that turns a pointer position into a view vector, because every other
// part of the effect reads it: get the view wrong and the parallax and the
// rainbow disagree, and the card stops looking like one object.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(new URL("../components/holo-card/holo-card.tsx", import.meta.url), "utf8")

const start = src.indexOf("// #region card")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "card region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*\{ ax: number; ay: number \}/g, "")
  .replace(/:\s*\[number, number, number\]/g, "")
  .replace(/:\s*\[number, number\]/g, "")
  .replace(/:\s*number/g, "")
const { clampTilt, tiltFromPointer, viewFromTilt, parallaxOffset, spectrum } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// ---- the tilt stays inside its limit -------------------------------------
{
  assert.equal(clampTilt(5, 16), 5)
  assert.equal(clampTilt(40, 16), 16, "clamps up")
  assert.equal(clampTilt(-40, 16), -16, "and down")
  // NaN and -0 both have to fall out as a plain 0: either one reaches the
  // shader as a uniform and takes the whole view vector with it.
  assert.equal(clampTilt(NaN, 16), 0, "NaN must not reach the uniform")
  assert.equal(clampTilt(-0, 16), 0, "nor negative zero")
}

// ---- pointer to tilt ------------------------------------------------------
{
  const max = 16
  const mid = tiltFromPointer(0.5, 0.5, max)
  assert.ok(Math.abs(mid.ax) < 1e-12 && Math.abs(mid.ay) < 1e-12, "the centre is flat")

  // The card leans into the cursor: pointer right lifts the right edge away
  // (positive rotateY), pointer up lifts the top toward you.
  assert.ok(tiltFromPointer(1, 0.5, max).ay > 0, "pointer right tilts right")
  assert.ok(tiltFromPointer(0, 0.5, max).ay < 0, "pointer left tilts left")
  assert.ok(tiltFromPointer(0.5, 0, max).ax > 0, "pointer up tilts up")
  assert.ok(tiltFromPointer(0.5, 1, max).ax < 0, "pointer down tilts down")

  // The corners reach exactly the limit, and a pointer dragged outside the
  // element does not send the card past it.
  for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1], [-3, 4], [9, -9]]) {
    const { ax, ay } = tiltFromPointer(x, y, max)
    assert.ok(Math.abs(ax) <= max + 1e-12, `ax left the limit at ${x},${y}: ${ax}`)
    assert.ok(Math.abs(ay) <= max + 1e-12, `ay left the limit at ${x},${y}: ${ay}`)
  }
}

// ---- the view vector ------------------------------------------------------
{
  const flat = viewFromTilt(0, 0)
  assert.ok(Math.abs(flat[0]) < 1e-12 && Math.abs(flat[1]) < 1e-12, "flat looks straight on")
  assert.ok(Math.abs(flat[2] - 1) < 1e-12, "and along +z")

  // It must stay a unit vector at every angle, or the foil phase drifts with
  // the magnitude instead of the direction.
  for (let ax = -40; ax <= 40; ax += 5) {
    for (let ay = -40; ay <= 40; ay += 5) {
      const v = viewFromTilt(ax, ay)
      assert.ok(Math.abs(Math.hypot(v[0], v[1], v[2]) - 1) < 1e-9, `not unit at ${ax},${ay}`)
      assert.ok(v.every(Number.isFinite), `non-finite at ${ax},${ay}`)
    }
  }
  // Signs: tilting right pushes the view vector's x positive.
  assert.ok(viewFromTilt(0, 20)[0] > 0, "tilt right moves the view right")
  assert.ok(viewFromTilt(20, 0)[1] < 0, "tilt up moves the view up")
}

// ---- parallax is bounded --------------------------------------------------
{
  const depth = 0.28
  // The bound is the whole point: dividing by the true |z| runs away at a
  // glancing angle and throws the layer clean off the card.
  const cap = (depth * 0.1) / 0.4
  for (let ax = -60; ax <= 60; ax += 4) {
    for (let ay = -60; ay <= 60; ay += 4) {
      const [ox, oy] = parallaxOffset(viewFromTilt(ax, ay), depth)
      assert.ok(Number.isFinite(ox) && Number.isFinite(oy), `non-finite at ${ax},${ay}`)
      assert.ok(Math.abs(ox) <= cap + 1e-9, `x offset ran away at ${ax},${ay}: ${ox}`)
      assert.ok(Math.abs(oy) <= cap + 1e-9, `y offset ran away at ${ax},${ay}: ${oy}`)
    }
  }
  // Flat on, nothing shifts.
  const [fx, fy] = parallaxOffset(viewFromTilt(0, 0), depth)
  assert.ok(Math.abs(fx) < 1e-12 && Math.abs(fy) < 1e-12, "no tilt, no parallax")
  // A negative depth pushes the other way — that is what puts the backdrop
  // behind the subject rather than beside it.
  const front = parallaxOffset(viewFromTilt(0, 20), 0.28)[0]
  const behind = parallaxOffset(viewFromTilt(0, 20), -0.2)[0]
  assert.ok(front > 0 && behind < 0, "depth sign must separate the layers")
}

// ---- the spectrum ---------------------------------------------------------
{
  for (let p = 0; p < 2; p += 0.01) {
    const c = spectrum(p)
    for (const v of c) {
      assert.ok(v >= 0.41 - 1e-9 && v <= 0.91 + 1e-9, `channel left its range at ${p}: ${v}`)
    }
  }
  // One turn of phase is one full cycle — to within the constant's own error.
  // The reference writes 2*pi as 6.28318, which is short by 5.3e-6, so a full
  // turn drifts by about 1e-6. Kept as written rather than silently corrected:
  // the difference is invisible and the port stays comparable to its source.
  const a = spectrum(0.123)
  const b = spectrum(1.123)
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(a[i] - b[i]) < 1e-5, "spectrum must be periodic")
  // The three channels are genuinely offset, or it is a greyscale ramp.
  const s = spectrum(0.1)
  assert.ok(Math.max(...s) - Math.min(...s) > 0.05, "the channels must actually separate")
}

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")

// Sizing and pointer coordinates come off the element, never the window.
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("canvas.clientWidth"), "the canvas measures its own box")
assert.ok(src.includes("getBoundingClientRect"), "pointer coordinates are relative to the card")
assert.ok(src.includes("new ResizeObserver"), "a resized box must resize the drawing buffer")

// The card is sized by width and an aspect ratio; a percentage height on the
// root would collapse it wherever the host has no height chain.
assert.ok(/aspectRatio: "5 \/ 7"/.test(src), "the card keeps the trading-card ratio")
const root = src.slice(src.indexOf("<div\n      className={\"relative select-none"), src.indexOf("{/* Front */}"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")

// One triangle covers the viewport only if it is oversized. Without the *2 the
// vertices land on (-1,-1) (1,-1) (-1,1) and exactly half the card renders,
// split corner to corner — which is what happened.
assert.ok(
  /gl_VertexID & 2\) \* 2\.0 - 1\.0/.test(src),
  "the fullscreen triangle must be oversized",
)

// atan wraps by 2*pi at the branch cut. A fractional angular multiplier leaves
// a fraction of a turn of phase there, and it shows as a hard seam running out
// of the centre of the card.
const ang = src.match(/atan\(p\.y, p\.x\) \* ([\d.]+)/)
assert.ok(ang, "the grating must be built from atan")
assert.ok(Number.isInteger(Number(ang[1])), `angular multiplier ${ang[1]} must be a whole number`)

// The shine has to follow the view, not a clock. uTime may appear only in the
// glitter; everything else reads uView.
assert.ok(src.includes("uView"), "the foil must read the view direction")
assert.ok(
  /phase = uv\.x[^;]*uView\.x/.test(src),
  "the holographic phase must be a function of the view",
)

// A dropped context must rebuild, and everything allocated must come back.
assert.ok(
  src.includes("webglcontextlost") && src.includes("webglcontextrestored"),
  "a dropped context must rebuild rather than stay black",
)
for (const gone of [
  "gl.deleteProgram(program)",
  "gl.deleteTexture(tex)",
  "gl.deleteVertexArray(vao)",
  "gl.deleteShader(vs)",
  "observer.disconnect()",
  "cancelAnimationFrame(raf)",
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}
assert.ok(src.includes("setFailed(true)"), "no WebGL2 must fall back, not go black")

// Reduced motion stops the idle drift and the glitter clock; the pointer still
// works, because that motion is the reader's own.
assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/t\.idle && !t\.reduced/.test(src), "reduced motion must stop the idle drift")
assert.ok(/uTime, t\.reduced \? 0 : now/.test(src), "and freeze the glitter")

// It is a control, so it has to be reachable without a pointer.
assert.ok(/tabIndex=\{flippable \? 0 : undefined\}/.test(src), "the card must be focusable")
assert.ok(src.includes('e.key === "Enter"'), "and flippable from the keyboard")
assert.ok(src.includes("aria-pressed"), "and report its state")

// A demo wrapper left at width:auto collapses inside 21st's centring flex.
for (const cls of readFileSync(
  new URL("../components/holo-card/demo.tsx", import.meta.url),
  "utf8",
).match(/className="[^"]*"/g) ?? []) {
  assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), `${cls} wraps the card without a width`)
}

console.log("holo-card: ok")
