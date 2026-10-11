// Runnable check for the layout, rotation, ripple and picking math in
// components/keycap-orb, plus the install-safety rules the .tsx has to keep.
// Run: node tests/keycap-orb.test.mjs
//
// The rendering is a shader and cannot be asserted here. What can is
// everything the shader is fed: where the caps sit, which one faces you, how a
// drag turns the ball, how far a ripple moves a cap, and which cap a pointer
// ray lands on.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(new URL("../components/keycap-orb/keycap-orb.tsx", import.meta.url), "utf8")

const start = src.indexOf("// #region orb")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "orb region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*(?:string \| undefined|Slot\[\]|number\[\]|Vec3|Quat|number)(?=[\s,)=;{])/g, "")
const {
  clamp, mulberry32, layoutSlots, angleBetween, frontOrder, qMul, qAxis, qNormalize, qRotate,
  ripplePulse, fitDistance, rayBox, raySphere, hexToLinear,
} = await import("data:text/javascript," + encodeURIComponent(js))

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps
const vclose = (a, b, eps = 1e-9) => a.every((v, i) => close(v, b[i], eps))

// ---- clamp and the PRNG ---------------------------------------------------
{
  assert.equal(clamp(NaN, 5, 15), 5, "NaN falls to the low end, not into a uniform")
  assert.equal(clamp(99, 5, 15), 15)
  const a = mulberry32(7)
  const b = mulberry32(7)
  for (let i = 0; i < 200; i++) {
    const v = a()
    assert.equal(v, b(), "the jitter must be the same on every load")
    assert.ok(v >= 0 && v < 1)
  }
}

// ---- layout ---------------------------------------------------------------
{
  const slots = layoutSlots(9)
  const step = Math.PI / 8
  for (const s of slots) {
    assert.ok(close(Math.hypot(...s.dir), 1), "every slot direction is a unit vector")
    assert.ok(close(Math.hypot(...s.east), 1), "and so is its east tangent")
    assert.ok(Math.abs(s.dir[0] * s.east[0] + s.dir[1] * s.east[1] + s.dir[2] * s.east[2]) < 1e-9,
      "east lies in the tangent plane")
    assert.ok(s.size > 0 && s.size <= 1, `size out of range: ${s.size}`)
  }
  // One cap faces the viewer dead on — the one the key list starts from.
  assert.ok(slots.some((s) => vclose(s.dir, [0, 0, 1])), "a slot must face +z")
  // Poles hold one cap each; the equator holds 2(n-1).
  assert.equal(slots.filter((s) => close(s.lat, Math.PI / 2)).length, 1)
  assert.equal(slots.filter((s) => close(s.lat, -Math.PI / 2)).length, 1)
  assert.equal(slots.filter((s) => close(s.lat, 0)).length, 16)
  // North and south mirror each other.
  for (let r = 1; r <= 3; r++) {
    const lat = r * step
    assert.equal(
      slots.filter((s) => close(s.lat, lat)).length,
      slots.filter((s) => close(s.lat, -lat)).length,
      `ring ${r} is not mirrored`,
    )
  }
  // No two caps crowd each other: centres stay most of a cap apart.
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const d = angleBetween(slots[i].dir, slots[j].dir)
      assert.ok(d > step * 0.8, `slots ${i} and ${j} overlap (${d.toFixed(3)} rad)`)
    }
  }
  // The ring count is clamped, and junk falls back rather than throwing.
  assert.equal(layoutSlots(NaN).length, layoutSlots(5).length)
  assert.equal(layoutSlots(400).length, layoutSlots(15).length)
  assert.ok(layoutSlots(11).length > slots.length, "more rings, more caps")
}

// ---- front order ----------------------------------------------------------
{
  const slots = layoutSlots(9)
  const order = frontOrder(slots)
  assert.equal(new Set(order).size, slots.length, "the order is a permutation")
  assert.ok(vclose(slots[order[0]].dir, [0, 0, 1]), "the first key sits dead centre")
  // Then the four neighbours clockwise from the left — which is what lands
  // HTML · CSS · JS across the middle row of the default set.
  const [l, u, r, d] = order.slice(1, 5).map((i) => slots[i].dir)
  assert.ok(l[0] < -0.3 && Math.abs(l[1]) < 1e-9, "second is the left neighbour")
  assert.ok(u[1] > 0.3 && Math.abs(u[0]) < 1e-9, "third is the one above")
  assert.ok(r[0] > 0.3 && Math.abs(r[1]) < 1e-9, "fourth is the right neighbour")
  assert.ok(d[1] < -0.3 && Math.abs(d[0]) < 1e-9, "fifth is the one below")
  // Distance from the front never decreases along the order.
  for (let k = 1; k < order.length; k++) {
    const a = angleBetween(slots[order[k - 1]].dir, [0, 0, 1])
    const b = angleBetween(slots[order[k]].dir, [0, 0, 1])
    assert.ok(b >= a - 1e-3, "front order must spiral outward")
  }
}

// ---- quaternions ----------------------------------------------------------
{
  // A drag right is a turn about +y, which carries the front of the ball right.
  const right = qRotate(qAxis([0, 1, 0], 0.3), [0, 0, 1])
  assert.ok(right[0] > 0, "drag right moves the front right")
  // A drag down is a turn about the camera's right axis, front moves down.
  const down = qRotate(qAxis([1, 0, 0], 0.3), [0, 0, 1])
  assert.ok(down[1] < 0, "drag down moves the front down")
  // Composition matches applying one after the other.
  const qa = qAxis([0, 1, 0], 0.7)
  const qb = qAxis([1, 0, 0], -0.4)
  const v = [0.2, -0.5, 0.84]
  assert.ok(vclose(qRotate(qMul(qa, qb), v), qRotate(qa, qRotate(qb, v)), 1e-12))
  // Length is preserved, and a quaternion gone bad comes back as identity
  // rather than taking every cap with it.
  assert.ok(close(Math.hypot(...qRotate(qNormalize([1, 2, 3, 4]), v)), Math.hypot(...v), 1e-12))
  assert.deepEqual(qNormalize([NaN, 0, 0, 0]), [0, 0, 0, 1])
  assert.deepEqual(qNormalize([0, 0, 0, 0]), [0, 0, 0, 1])
}

// ---- ripple ---------------------------------------------------------------
{
  // Nothing moves before the wave arrives, and it ends.
  assert.equal(ripplePulse(0, 0), 0)
  assert.equal(ripplePulse(0.1, 1.5), 0, "a far cap has not been reached yet")
  assert.equal(ripplePulse(5, 0), 0, "the ripple ends")
  let peakNear = 0
  let peakFar = 0
  for (let t = 0; t < 3; t += 0.002) {
    const near = ripplePulse(t, 0.2)
    const far = ripplePulse(t, 2.5)
    assert.ok(Number.isFinite(near) && Math.abs(near) <= 0.42, "bounded")
    peakNear = Math.max(peakNear, Math.abs(near))
    peakFar = Math.max(peakFar, Math.abs(far))
  }
  assert.ok(peakNear > 0.05, "a neighbour visibly moves")
  assert.ok(peakFar < peakNear, "the far side answers softer")
}

// ---- framing --------------------------------------------------------------
{
  const fov = (28 * Math.PI) / 180
  for (const aspect of [0.4, 0.75, 1, 1.5, 2.4]) {
    for (const fill of [0.3, 0.62, 0.95]) {
      const d = fitDistance(2.4, fov, aspect, fill)
      // The ball's angular radius must fit inside the shorter half-extent.
      const half = Math.atan(Math.tan(fov / 2) * Math.min(1, aspect))
      const ball = Math.asin(2.4 / d)
      assert.ok(ball < half, `ball overflows at aspect ${aspect}, fill ${fill}`)
    }
  }
  assert.ok(fitDistance(2, 0.5, 0.5, 0.6) > fitDistance(2, 0.5, 1, 0.6), "portrait pulls back")
}

// ---- picking --------------------------------------------------------------
{
  const lo = [-0.5, 0, -0.5]
  const hi = [0.5, 0.6, 0.5]
  assert.ok(close(rayBox([0, 5, 0], [0, -1, 0], lo, hi), 4.4), "hits the top of the cap")
  assert.equal(rayBox([2, 5, 0], [0, -1, 0], lo, hi), -1, "misses beside it")
  assert.equal(rayBox([0, 5, 0], [0, 1, 0], lo, hi), -1, "nothing behind the ray")
  assert.ok(rayBox([0, 0.3, 0], [1, 0, 0], lo, hi) >= 0, "a ray from inside still reports")
  assert.ok(close(raySphere([0, 0, 10], [0, 0, -1], [0, 0, 0], 2), 8))
  assert.equal(raySphere([0, 3, 10], [0, 0, -1], [0, 0, 0], 2), -1)
}

// ---- colour ---------------------------------------------------------------
{
  assert.deepEqual(hexToLinear("#fff", [9, 9, 9]), [1, 1, 1])
  assert.deepEqual(hexToLinear("#000000", [9, 9, 9]), [0, 0, 0])
  assert.ok(close(hexToLinear("#808080", [0, 0, 0])[0], 0.2158605, 1e-6), "sRGB is linearised")
  assert.deepEqual(hexToLinear("blue", [1, 2, 3]), [1, 2, 3], "junk falls back")
  assert.deepEqual(hexToLinear(undefined, [1, 2, 3]), [1, 2, 3])
}

// ---- the shader agrees with the geometry ----------------------------------
{
  const ts = (name) => Number(src.match(new RegExp("^const " + name + " = ([\\d.]+)", "m"))?.[1])
  const glsl = (name) => Number(src.match(new RegExp("const float " + name + " = ([\\d.]+);"))?.[1])
  for (const name of ["KEY_H", "TOP_HALF", "CELL"]) {
    assert.ok(Number.isFinite(ts(name)), `${name} missing in TS`)
    assert.equal(glsl(name), ts(name), `${name} differs between the mesh and the shader`)
  }
  // The legend cell index must not be interpolated: rounding error across a
  // triangle flips floor(id / cells) per pixel and samples the next legend.
  assert.ok(src.includes("flat out vec4 vInfo") && src.includes("flat in vec4 vInfo"),
    "instance info must be a flat varying")
  // A mipmapped lookup inside a non-uniform branch has undefined derivatives.
  const frag = src.slice(src.indexOf("const MESH_FRAG"), src.indexOf("const compile"))
  for (const m of frag.matchAll(/if \([^)]*\) \{([^}]*)\}/g)) {
    assert.doesNotMatch(m[1], /texture\(/, "the legend atlas is sampled outside any branch")
  }
}

// ---- every icon has a glyph -----------------------------------------------
{
  const union = src.slice(src.indexOf("export type KeycapIcon ="), src.indexOf("export type Keycap ="))
  const names = [...union.matchAll(/"([a-z]+)"/g)].map((m) => m[1]).filter((n) => n !== "none")
  const icons = src.slice(src.indexOf("const ICONS"), src.indexOf("// Characters that obviously"))
  for (const n of names) assert.ok(new RegExp("^\\s+" + n + ": \\[", "m").test(icons), `no glyph for ${n}`)
  const defaults = src.slice(src.indexOf("export const DEFAULT_KEYS"), src.indexOf("// Glyphs on a 24-unit grid"))
  for (const m of defaults.matchAll(/icon: "([a-z]+)"/g)) {
    assert.ok(m[1] === "none" || names.includes(m[1]), `default key uses unknown icon ${m[1]}`)
  }
}

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /\$\{/, "no template interpolation in the shader strings")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("canvas.clientWidth"), "the canvas measures its own box")
assert.ok(src.includes("getBoundingClientRect"), "pointer coordinates are relative to the element")
assert.ok(src.includes("new ResizeObserver"), "a resized box must resize the drawing buffer")
assert.ok(src.includes("new IntersectionObserver"), "drawing pauses off-screen")

// Height is an explicit length on the root; a percentage would collapse
// wherever the host has no height chain.
assert.ok(/height = "100svh"/.test(src), "height defaults to a definite length")
const root = src.slice(src.indexOf("<div\n      ref={rootRef}"), src.indexOf("{failed ?"))
assert.ok(root.includes("style={{ height,"), "the root takes the height prop")
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")
assert.ok(/maxWidth: "none"/.test(src), "the canvas is guarded against Preflight's max-width")

// A dropped context must rebuild, and everything allocated must come back.
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"))
for (const gone of [
  "gl.deleteProgram(bgProgram)",
  "gl.deleteProgram(meshProgram)",
  "gl.deleteTexture(atlas)",
  "gl.deleteVertexArray(v)",
  "gl.deleteBuffer(b)",
  "observer.disconnect()",
  "io.disconnect()",
  "cancelAnimationFrame(raf)",
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}
for (const m of src.matchAll(/root\.addEventListener\("([a-z]+)", (\w+)\)/g)) {
  assert.ok(src.includes(`root.removeEventListener("${m[1]}", ${m[2]})`), `${m[1]} listener is never removed`)
}
assert.ok(src.includes("setFailed(true)"), "no WebGL2 must fall back, not go black")

// Reduced motion stops the idle spin, the float and the ripple; dragging and
// pressing still work.
assert.ok(src.includes("prefers-reduced-motion"))
assert.ok(/t\.autoRotate && !calm/.test(src), "reduced motion stops the idle spin")
assert.ok(/const bob = calm \? 0/.test(src), "and the float")
assert.ok(/tuning\.current\.ripple && !tuning\.current\.reduced/.test(src), "and the ripple")

// It is a control, so it has to be reachable and audible without a pointer.
assert.ok(src.includes("tabIndex={0}"), "the orb must be focusable")
assert.ok(src.includes('role="application"'), "and say it takes keys")
assert.ok(src.includes('aria-live="polite"'), "and announce presses")
assert.ok(src.includes('touchAction: "pan-y"'), "touch keeps the page scrollable")

// Full-bleed demos stay full-bleed — no centring wrapper shrinking them.
for (const demo of ["demo.tsx", "demo-custom.tsx"]) {
  const d = readFileSync(new URL("../components/keycap-orb/" + demo, import.meta.url), "utf8")
  assert.ok(d.includes('from "@/components/ui/keycap-orb"'), `${demo} imports the installed path`)
  assert.doesNotMatch(d, /<div/, `${demo} must not wrap the orb`)
}

console.log("keycap-orb: ok")
