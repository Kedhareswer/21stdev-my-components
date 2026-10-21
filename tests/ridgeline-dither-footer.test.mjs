// Install-safety and dither/terrain checks for ridgeline-dither-footer.
// Run: node tests/ridgeline-dither-footer.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/ridgeline-dither-footer/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("ridgeline-dither-footer.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|url\(/, "nothing fetched by the styles")
assert.match(src, /height = "\d+px"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none"), "the canvas is guarded against Preflight")
assert.ok(src.includes("image-rendering: pixelated"), "dither pixels are scaled up crisp, not blurred")
assert.ok(src.includes("new ResizeObserver") && src.includes("IntersectionObserver"), "resizes with its box and sleeps off-screen")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", "mo.disconnect()", 'root.removeEventListener("pointermove", onMove)', 'root.removeEventListener("pointerdown", onDown)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.ok(src.includes('<a className="rdf-link" href='), "links are real anchors")
assert.ok(src.includes("aria-label={s.label || SOCIAL_NAMES[s.icon]}"), "icon-only social links are named")
assert.ok(src.includes('<canvas ref={canvasRef} aria-hidden="true" />'), "the canvas is hidden from screen readers")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Exclude<|Omit<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
const files = readdirSync(dir).sort()
assert.deepEqual(files, ["README.md", "demo-dusk.tsx", "demo-glacier.tsx", "demo.tsx", "ridgeline-dither-footer.tsx"], "folder holds only the component, demos and README")
for (const f of files.filter((f) => f.startsWith("demo"))) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/ridgeline-dither-footer"], f + ": imports only the component")
  assert.match(d, /className="w-full"/, f + ": full width inside 21st's flex wrapper")
}
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/ridgeline-dither-footer"'), "tsconfig paths line exists")

// ---- scoped CSS ----
const css = src.match(/const RDF_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".rdf-")), "unscoped selector: " + sel)
}

// ---- dither and terrain ----
const a = src.indexOf("// #region ridge\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "ridge region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

assert.deepEqual(L.rdfHex("#2e7c52"), [46, 124, 82])
assert.deepEqual(L.rdfHex("#fff"), [255, 255, 255])
assert.equal(L.rdfHex("seagreen"), null, "named colours fall back instead of breaking the palette")
const px = L.rdfPack([1, 2, 3])
assert.deepEqual([px & 255, (px >>> 8) & 255, (px >>> 16) & 255, px >>> 24], [1, 2, 3, 255], "packs RGBA for a little-endian Uint32 view")

assert.equal(L.RDF_BAYER.length, 64)
assert.deepEqual([...L.RDF_BAYER].map((v) => v * 64 - 0.5).sort((x, y) => x - y), [...Array(64).keys()], "Bayer matrix is a permutation of 0–63")
assert.ok(L.RDF_BAYER.every((v) => v > 0 && v < 1), "thresholds sit strictly inside (0, 1)")

// Paper stays paper and full tone stays full at every threshold.
for (const t of L.RDF_BAYER) {
  assert.equal(L.rdfDither(0, 7, t), 0)
  assert.equal(L.rdfDither(1, 7, t), 6)
  assert.equal(L.rdfDither(-3, 7, t), 0, "clamps below")
  assert.equal(L.rdfDither(9, 7, t), 6, "clamps above")
}
// Over one 8×8 tile the mean index reproduces the tone: the dither is tone-true.
for (const tone of [0.1, 0.37, 0.5, 0.83]) {
  const mean = L.RDF_BAYER.reduce((s, t) => s + L.rdfDither(tone, 7, t), 0) / 64
  assert.ok(Math.abs(mean - tone * 6) < 0.1, "tone " + tone + " averages to " + mean)
}

for (let i = 0; i < 500; i++) {
  const h = L.rdfHash(i * 7 - 300, i * 13, 5)
  assert.ok(h >= 0 && h < 1, "hash in [0, 1)")
  const n = L.rdfNoise(i * 0.173, i * 0.091, 9)
  assert.ok(n >= 0 && n < 1, "noise in [0, 1)")
  const f = L.rdfFbm(i * 0.11, 2.5, 3, 3)
  assert.ok(f >= 0 && f < 1, "fbm in [0, 1)")
}
assert.equal(L.rdfHash(3, 4, 5), L.rdfHash(3, 4, 5), "hash is deterministic")
assert.equal(L.rdfNoise(2, 3, 1), L.rdfHash(2, 3, 1), "noise passes through its lattice")
assert.ok(Math.abs(L.rdfNoise(2.5, 3, 1) - L.rdfNoise(2.5001, 3, 1)) < 1e-3, "noise is continuous")

assert.equal(L.rdfSmooth(0, 10, -1), 0)
assert.equal(L.rdfSmooth(0, 10, 5), 0.5)
assert.equal(L.rdfSmooth(0, 10, 20), 1)
assert.equal(L.rdfEase(-1), 0)
assert.equal(L.rdfEase(2), 1)
assert.ok(L.rdfEase(0.5) > 0.5, "eases out")

// Terrain: deterministic, inside the grid, and far ridges sit above near ones.
const cols = 400
const rows = 200
const margin = 20
const ridge = (i) => L.rdfRidgeline(cols, rows, i, 6, 7, margin)
assert.equal(ridge(0).length, cols + margin * 2)
assert.deepEqual([...ridge(2)], [...ridge(2)], "same seed, same range")
assert.notDeepEqual([...L.rdfRidgeline(cols, rows, 2, 6, 8, margin)], [...ridge(2)], "a new seed is a new range")
const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length
const means = [0, 1, 2, 3, 4, 5].map((i) => mean([...ridge(i)]))
for (let i = 1; i < means.length; i++) assert.ok(means[i] > means[i - 1], "ridge " + i + " sits lower than the one behind it")
for (let i = 0; i < 6; i++) assert.ok([...ridge(i)].every((v) => Number.isFinite(v) && v > -rows && v < rows * 1.5), "ridge " + i + " stays near the grid")
const front = ridge(5)
const centre = front[margin + cols / 2]
assert.ok(front[margin] < centre && front[margin + cols - 1] < centre, "the nearest ridge climbs at both edges into a valley")

assert.ok(L.rdfElevation(0, 200, 0, 6) > L.rdfElevation(200, 200, 0, 6), "higher crests read higher")
assert.ok(L.rdfElevation(100, 200, 0, 6) > L.rdfElevation(100, 200, 5, 6), "the far range is the higher one")
assert.equal(L.rdfElevation(500, 200, 5, 6), 420, "clamped at the valley floor")

console.log("ridgeline-dither-footer: ok")
