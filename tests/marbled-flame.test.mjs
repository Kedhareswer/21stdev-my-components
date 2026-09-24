// Runnable check for the pointer/flare math in components/marbled-flame, plus
// the install-safety rules the .tsx has to keep.
// Run: node tests/marbled-flame.test.mjs
//
// The fire itself is a fragment shader and cannot be asserted here. What can be
// is the part that decides how hard the hand hits it — where the failures are
// silent: a flick that tears the whole flame off-screen, a smear that never
// heals, a flare that never burns out, a palette string that turns into NaN.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/marbled-flame/marbled-flame.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "logic region markers missing")

const js = src
  .slice(start, end)
  .replace(/\):\s*\[number, number, number\]/g, ")")
  .replace(/\):\s*\[number, number\]/g, ")")
  .replace(/:\s*(string|number)(?=[,)\s={])/g, "")
const { hexToRgb, pointerVelocity, decay, flareEnvelope } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// ---- palette parsing -----------------------------------------------------
assert.deepEqual(hexToRgb("#ffffff"), [1, 1, 1])
assert.deepEqual(hexToRgb("#000"), [0, 0, 0])
assert.deepEqual(hexToRgb("f00"), [1, 0, 0], "the # is optional")
assert.deepEqual(hexToRgb("  #FF0000 "), [1, 0, 0], "case and whitespace are forgiven")
{
  const [r, g, b] = hexToRgb("#ee1530")
  assert.ok(Math.abs(r - 0xee / 255) < 1e-9 && Math.abs(g - 0x15 / 255) < 1e-9 && Math.abs(b - 0x30 / 255) < 1e-9)
}
for (const bad of ["", "red", "#12345", "#gggggg", "rgb(1,2,3)"]) {
  const c = hexToRgb(bad)
  assert.ok(c.every((v) => Number.isFinite(v)), `${bad} must not upload NaN to the shader`)
}

// ---- a flick cannot tear the fire off the screen -------------------------
{
  const [vx, vy] = pointerVelocity(0.5, 0, 1 / 1000, 3)
  assert.ok(Math.abs(Math.hypot(vx, vy) - 3) < 1e-9, "speed is capped")
  assert.ok(vx > 0 && Math.abs(vy) < 1e-9, "direction survives the cap")
  const [sx, sy] = pointerVelocity(0.01, 0.02, 0.1, 3)
  assert.ok(Math.abs(sx - 0.1) < 1e-9 && Math.abs(sy - 0.2) < 1e-9, "slow strokes pass through untouched")
  const [zx, zy] = pointerVelocity(0, 0, 0, 3)
  assert.ok(zx === 0 && zy === 0, "a zero-length, zero-time move is not NaN")
}

// ---- smears heal ---------------------------------------------------------
{
  let life = 1
  for (let i = 0; i < 60; i++) life = decay(life, 1 / 60, 1.4)
  assert.ok(life > 0 && life < 1, "one second into a 1.4s fade the smear is partway healed")
  for (let i = 0; i < 30; i++) life = decay(life, 1 / 60, 1.4)
  assert.equal(life, 0, "fully healed shortly after trailFade")
  assert.equal(decay(0.1, 10, 1), 0, "never goes negative")
  assert.ok(Number.isFinite(decay(1, 1 / 60, 0)), "a zero fade time does not divide by zero")
}

// ---- a flare strikes fast and burns out ------------------------------------
{
  assert.equal(flareEnvelope(0), 0)
  assert.equal(flareEnvelope(-1), 0)
  assert.ok(Math.abs(flareEnvelope(0.15) - 1) < 1e-9, "peaks at the end of the strike")
  let prev = 1
  for (let a = 0.2; a < 6; a += 0.1) {
    const v = flareEnvelope(a)
    assert.ok(v <= prev + 1e-12, `must only fade after the peak (age ${a})`)
    prev = v
  }
  assert.ok(flareEnvelope(4) < 0.01, "a flare is gone within ~4s so its slot frees up")
}

// The shader mirrors flareEnvelope; if the two drift apart the slot is freed
// while the flare is still visible, and it vanishes mid-burn.
assert.ok(src.includes("fl.z < 0.15 ? fl.z / 0.15 : exp(-(fl.z - 0.15) * 1.25)"), "shader flare envelope matches the JS one")

// ---- install safety ------------------------------------------------------
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
assert.ok(
  src.includes("webglcontextlost") && src.includes("webglcontextrestored"),
  "a dropped context must rebuild rather than stay black",
)
for (const gone of [
  "gl.deleteProgram(program)",
  "gl.deleteBuffer(buffer)",
  "observer.disconnect()",
  "io.disconnect()",
  "cancelAnimationFrame(raf)",
  'removeEventListener("pointermove", onMove)',
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/if \(reduced\)/.test(src), "reduced motion must take its own path")

// Every uniform the shader declares has to be fed, and every table key has to
// exist in the shader: both sides are written by hand.
const frag = src.slice(src.indexOf("const FRAG"), src.indexOf("export type MarbledFlameProps"))
const declared = [...frag.matchAll(/^uniform\s+\w+\s+(u\w+)(?:\[[^\]]*\])?;/gm)].map((m) => m[1])
const keys = (name) => {
  const block = src.slice(src.indexOf(`const ${name} = [`), src.indexOf("] as const", src.indexOf(`const ${name} = [`)))
  return [...block.matchAll(/"(\w+)"/g)].map((m) => "u" + m[1][0].toUpperCase() + m[1].slice(1))
}
const fed = [...keys("FLOAT_KEYS"), ...keys("COLOR_KEYS")]
const fixed = ["uRes", "uTime", "uPx", "uAngle", "uLean", "uTrail", "uTrailLife", "uFlares"]
for (const u of declared) {
  assert.ok(fed.includes(u) || fixed.includes(u), `${u} is declared in the shader but nothing uploads it`)
}
for (const u of fed) assert.ok(declared.includes(u), `${u} is uploaded but the shader never declares it`)
for (const u of fixed) assert.ok(src.includes(`loc("${u}")`), `${u} is never looked up`)

// Every tunable in the params type must have a default — a missing one uploads
// undefined, which WebGL reads as 0 and the fire silently vanishes.
const typeBlock = src.slice(src.indexOf("export type FlameParams"), src.indexOf("export const FLAME_DEFAULTS"))
const defaultsBlock = src.slice(src.indexOf("export const FLAME_DEFAULTS"), src.indexOf("export const FLAME_PRESETS"))
for (const [, k] of typeBlock.matchAll(/^\s{2}(\w+):/gm)) {
  assert.ok(new RegExp(`^\\s{2}${k}:`, "m").test(defaultsBlock), `FLAME_DEFAULTS is missing ${k}`)
}

// A demo wrapper left at width:auto collapses the canvas to 0px wide inside
// 21st's centring flex.
for (const name of ["demo.tsx", "demo-presets.tsx"]) {
  const demo = readFileSync(new URL(`../components/marbled-flame/${name}`, import.meta.url), "utf8")
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) {
    if (!/relative/.test(cls)) continue
    assert.ok(/w-(full|screen|\[|\d)/.test(cls), `${name}: ${cls} wraps the fire without a width`)
  }
}

console.log("marbled-flame: ok")
