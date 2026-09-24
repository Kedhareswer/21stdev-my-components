// Runnable check for components/etched-accretion: the CPU-side logic that
// feeds the shader, and the install-safety rules the .tsx has to keep.
// Run: node tests/etched-accretion.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/etched-accretion/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("etched-accretion.tsx")

const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "logic region markers missing")
// sanitize() falls back to the defaults, so they ride along with the region.
const defaults = src.slice(src.indexOf("export const ACCRETION_DEFAULTS"), src.indexOf("export const ACCRETION_PRESETS"))
const { hexToRgb, approach, pointerToParallax, idleDrift, sanitize, ACCRETION_DEFAULTS } = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(defaults + src.slice(start, end)))
)

// ---- colours ---------------------------------------------------------------
assert.deepEqual(hexToRgb("#ffffff"), [1, 1, 1])
assert.deepEqual(hexToRgb("#000"), [0, 0, 0])
assert.deepEqual(hexToRgb("f00"), [1, 0, 0], "the # is optional")
assert.deepEqual(hexToRgb(" #FF0000 "), [1, 0, 0], "case and whitespace do not matter")
for (const bad of ["red", "#12345", "", "#ggg", "rgb(1,2,3)"]) {
  assert.deepEqual(hexToRgb(bad), [0, 0, 0], `unparseable ${JSON.stringify(bad)} must not reach the shader as NaN`)
}

// ---- easing never overshoots and is frame-rate independent -----------------
assert.ok(approach(0, 1, 100, 5) <= 1 && approach(1, 0, 100, 5) >= 0, "a huge step must not overshoot")
assert.equal(approach(0.3, 0.3, 1 / 60, 3), 0.3)
assert.equal(approach(0.3, 1, -1, 3), 0.3, "a negative dt is a no-op")
{
  let a = 0, b = 0
  for (let i = 0; i < 60; i++) a = approach(a, 1, 1 / 60, 2)
  for (let i = 0; i < 30; i++) b = approach(b, 1, 1 / 30, 2)
  assert.ok(Math.abs(a - b) < 1e-9, `60Hz and 30Hz must land in the same place: ${a} vs ${b}`)
}

// ---- pointer → parallax -----------------------------------------------------
{
  const rect = { left: 100, top: 50, width: 400, height: 200 }
  assert.deepEqual(pointerToParallax(300, 150, rect), [0, 0], "the centre is still")
  assert.deepEqual(pointerToParallax(100, 50, rect), [-1, 1], "top-left, y up")
  assert.deepEqual(pointerToParallax(9999, -9999, rect), [1, 1], "clamped outside the box")
  const z = pointerToParallax(0, 0, { left: 0, top: 0, width: 0, height: 0 })
  assert.ok(z.every(Number.isFinite), "a collapsed box must not divide by zero")
}
for (let t = 0; t < 2000; t += 0.7) {
  const [x, y] = idleDrift(t)
  assert.ok(Math.abs(x) <= 1 && Math.abs(y) <= 1, `idle drift left the parallax range at t=${t}`)
}

// ---- parameters are clamped before they reach the GPU ----------------------
{
  const D = ACCRETION_DEFAULTS
  const s = sanitize({ ...D, inclination: 0, holeSize: NaN, streakDensity: 1e9, center: [Infinity, 0.5] })
  assert.ok(s.inclination >= 0.08, "an edge-on disk divides by zero in the shader")
  assert.equal(s.holeSize, D.holeSize, "NaN falls back to the default")
  assert.ok(s.streakDensity <= 800)
  assert.equal(s.center[0], D.center[0])
  assert.deepEqual(sanitize(D), D, "the defaults already sit inside every range")
}

// ---- install safety ---------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /https?:\/\/(?!21st)/, "no network assets — the piece is procedural")

assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("canvas.clientWidth") && src.includes("new ResizeObserver"), "the canvas measures its own box")
assert.ok(src.includes("getBoundingClientRect"), "pointer coordinates are relative to the component")

assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
const root = src.slice(src.indexOf("<section"), src.indexOf("{failed ?"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")
assert.ok(/maxWidth: "none"/.test(src), "guard Preflight's img/canvas max-width")

assert.ok(src.includes("setFailed(true)") && src.includes("radial-gradient"), "needs a still fallback without WebGL2")
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "a dropped context must rebuild")
assert.ok(src.includes("prefers-reduced-motion") && /if \(reduced\)/.test(src), "reduced motion takes its own path")
assert.ok(src.includes("IntersectionObserver"), "stop drawing off screen")

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

// Holding a button in the overlay must not also feed the black hole.
assert.ok(src.includes("closest(INTERACTIVE)"), "hold-to-feed ignores interactive children")

// ---- shader and uploader agree ------------------------------------------------
const declared = [...src.matchAll(/^uniform\s+\w+\s+(u\w+);/gm)].map((m) => m[1])
const fed = [...src.matchAll(/\["(u\w+)",\s*"\w+"\]/g)].map((m) => m[1])
const frame = src.match(/FRAME_UNIFORMS = \[([^\]]+)\]/)[1].match(/u\w+/g)
for (const u of declared) {
  assert.ok(fed.includes(u) || frame.includes(u), `${u} is declared but nothing uploads it`)
}
for (const u of [...fed, ...frame]) assert.ok(declared.includes(u), `${u} is uploaded but not declared`)
for (const [, key] of src.matchAll(/\["u\w+",\s*"(\w+)"\]/g)) {
  assert.ok(key in ACCRETION_DEFAULTS, `uniform source ${key} is not a parameter`)
}
assert.doesNotMatch(src.slice(src.indexOf("const FRAG"), src.indexOf("}`", src.indexOf("const FRAG"))), /\$\{/,
  "the shader is a literal — no interpolation")

// ---- demos -------------------------------------------------------------------
for (const name of ["demo.tsx", "demo-presets.tsx"]) {
  const demo = read(name)
  assert.ok(demo.includes('from "@/components/ui/etched-accretion"'), `${name} imports the installed path`)
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) {
    if (!/"relative/.test(cls)) continue
    assert.ok(/w-(full|screen|\[|\d)/.test(cls), `${name}: ${cls} wraps the canvas without a width`)
  }
}
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/etched-accretion"'), "tsconfig paths needs the component line")

console.log("etched-accretion: ok")
