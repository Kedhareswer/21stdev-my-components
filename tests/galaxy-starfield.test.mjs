// Install-safety and sky checks for galaxy-starfield.
// Run: node tests/galaxy-starfield.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/galaxy-starfield/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("galaxy-starfield.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import (no three.js)")
assert.doesNotMatch(src, /@import|https?:\/\//, "nothing fetched")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none"), "the canvas is guarded against Preflight")
assert.ok(src.includes("gsf-fallback"), "falls back without WebGL")
assert.ok(/swiftshader\|llvmpipe/.test(src), "thins out on software renderers")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", 'root.removeEventListener("pointermove", onMove)', "gl.deleteProgram(prog.p)", "gl.deleteBuffer(starBuf)"]) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src.match(/const GSF_CSS = `([\s\S]*?)`/)[1], /\$\{|`/, "no interpolation in the CSS string")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|React\.[A-Za-z]+<|\[K in /,
  "no generics or mapped types before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
for (const f of ["demo.tsx", "demo-aurora.tsx"]) {
  const d = read(f)
  assert.deepEqual(
    [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]).filter((m) => m !== "react"),
    ["@/components/ui/galaxy-starfield"],
    f + " imports only the component",
  )
}

// ---- pure helpers, lifted out of the component and executed ----
const region = src.slice(src.indexOf("// #region starfield"), src.indexOf("// #endregion"))
const mod = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(region)))
const { gsfRandom, gsfLinear, gsfHex, gsfStars, gsfPerspective, gsfOrbit, gsfLookAt, gsfLean, gsfEase } = mod
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e

const a = gsfRandom(3)
const b = gsfRandom(3)
for (let i = 0; i < 5; i++) assert.equal(a(), b(), "the PRNG is deterministic")

assert.deepEqual(gsfHex("#fff", [0]), [1, 1, 1])
assert.deepEqual(gsfHex("nope", [9]), [9], "bad colours fall back")
const mid = gsfLinear("#808080", [0])
assert.ok(mid[0] > 0.2 && mid[0] < 0.23, "sRGB grey decodes to about 0.216 linear")

// Stars fill the ball, carry their palette colour, and are mostly small.
const pal = [[1, 0, 0], [0, 0, 1]]
const s = gsfStars(4000, 800, pal, 9)
assert.equal(s.length, 4000 * 9)
let big = 0
for (let i = 0; i < 4000; i++) {
  const o = i * 9
  assert.ok(Math.hypot(s[o], s[o + 1], s[o + 2]) <= 800 + 1e-3, "inside the radius")
  assert.ok(s[o + 6] >= 1 && s[o + 6] <= 21, "size in range")
  if (s[o + 6] > 10) big++
  assert.ok(s[o + 8] >= 0.5 && s[o + 8] <= 4.5, "twinkle speed in range")
  assert.ok(s[o + 3] >= 0 && s[o + 3] <= 1 && s[o + 5] <= 1, "colour stays in 0–1")
}
assert.ok(big < 4000 * 0.12, "only a few stars are bright")
assert.deepEqual(Array.from(gsfStars(10, 800, pal, 4)), Array.from(gsfStars(10, 800, pal, 4)), "seeded")

// Camera: the orbit keeps its distance, the view puts the origin straight ahead.
const eye = gsfOrbit(0.7, 0.3, 100)
assert.ok(near(Math.hypot(eye[0], eye[1], eye[2]), 100, 1e-9))
const { view } = gsfLookAt(eye)
// The origin in view space is (0, 0, -100).
assert.ok(near(view[12], 0, 1e-9) && near(view[13], 0, 1e-9) && near(view[14], -100, 1e-9))
const p = gsfPerspective(Math.PI / 3, 2, 0.1, 2000)
assert.ok(near(p[5], 1 / Math.tan(Math.PI / 6), 1e-9) && near(p[0], p[5] / 2, 1e-9))

// The lean is a rotation: its columns are unit length and orthogonal.
const r = gsfLean(0.2, -0.4)
const col = (i) => [r[i * 4], r[i * 4 + 1], r[i * 4 + 2]]
for (let i = 0; i < 3; i++) assert.ok(near(Math.hypot(...col(i)), 1, 1e-9))
const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2]
assert.ok(near(dot(col(0), col(1)), 0, 1e-9) && near(dot(col(1), col(2)), 0, 1e-9))

assert.equal(gsfEase(-1), 0)
assert.equal(gsfEase(2), 1)
assert.ok(gsfEase(0.5) > 0.5, "eases out")

console.log("galaxy-starfield: ok")
