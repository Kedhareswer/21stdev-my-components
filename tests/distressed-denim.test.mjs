// Install-safety and cloth checks for distressed-denim.
// Run: node tests/distressed-denim.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/distressed-denim/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("distressed-denim.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|https?:\/\//, "nothing fetched")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none"), "the canvas is guarded against Preflight")
assert.ok(src.includes("ddm-fallback"), "falls back without WebGL")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", 'root.removeEventListener("pointermove", onMove)', "gl.deleteProgram(program)"]) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src.match(/const DDM_CSS = `([\s\S]*?)`/)[1], /\$\{|`/, "no interpolation in the CSS string")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
const demo = read("demo.tsx")
assert.deepEqual([...demo.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]), ["@/components/ui/distressed-denim"])

// ---- pure helpers, lifted out of the component and executed ----
const region = src.slice(src.indexOf("// #region denim"), src.indexOf("// #endregion"))
const mod = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(region)))
const { ddmRandom, ddmHex, ddmSegDist, ddmSpacing, ddmSlashes } = mod

const a = ddmRandom(7)
const b = ddmRandom(7)
for (let i = 0; i < 5; i++) assert.equal(a(), b(), "the PRNG is deterministic")

assert.deepEqual(ddmHex("#fff", [0]), [1, 1, 1])
assert.deepEqual(ddmHex("000000", [0]), [0, 0, 0])
assert.deepEqual(ddmHex("tomato", [9]), [9], "named colours fall back")

assert.equal(ddmSegDist(5, 3, 0, 0, 10, 0), 3)
assert.equal(ddmSegDist(-4, 3, 0, 0, 10, 0), 5, "clamps to the segment's end")
assert.equal(ddmSegDist(3, 4, 0, 0, 0, 0), 5, "a zero-length stroke is a point")

// The mesh is indexed with Uint16, so it must stay under 65536 points on any screen.
for (const [w, h] of [[320, 568], [1440, 900], [3840, 2160], [7680, 4320], [1, 1]]) {
  const s = ddmSpacing(w, h, 14000)
  const mx = w * 0.1 + 2 * s
  const nx = Math.ceil((w + 2 * mx) / s) + 1
  const ny = Math.ceil((h * 1.25 + 2 * s) / s) + 1
  assert.ok(s >= 7, "spacing floor at " + w + "x" + h)
  assert.ok(nx * ny < 65536, "too many points at " + w + "x" + h + ": " + nx * ny)
}

const sl = ddmSlashes(12, 3)
assert.equal(sl.length, 12)
for (const [x0, y0, x1, y1] of sl) {
  for (const v of [x0, y0, x1, y1]) assert.ok(v > 0.1 && v < 0.9, "slashes stay near the middle")
  assert.ok(Math.abs(x1 - x0) > Math.abs(y1 - y0), "slashes run across the warp")
}
assert.deepEqual(ddmSlashes(4, 9), ddmSlashes(4, 9), "slashes are seeded")

console.log("distressed-denim: ok")
