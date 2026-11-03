// Install-safety, scene and form checks for meadow-rise-footer.
// Run: node tests/meadow-rise-footer.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/meadow-rise-footer/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("meadow-rise-footer.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|url\(/, "nothing fetched by the styles")
assert.match(src, /height = "\d+px"/, "height defaults to a definite length")
assert.match(src, /heroHeight = "clamp\(\d+px, \d+svh, \d+px\)"/, "the hero band defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none"), "the canvas is guarded against Preflight")
assert.ok(src.includes("new ResizeObserver") && src.includes("IntersectionObserver"), "resizes with its box and knows when it is seen")
for (const gone of [
  "cancelAnimationFrame(raf)",
  "window.clearTimeout(rebuildTimer)",
  "ro.disconnect()",
  "io.disconnect()",
  "mo.disconnect()",
  'root.removeEventListener("pointermove", onMove)',
  'root.removeEventListener("pointerleave", onLeave)',
  'window.removeEventListener("scroll", onScroll)',
  'window.removeEventListener("resize", onScroll)',
]) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.ok(src.includes('<canvas ref={canvasRef} aria-hidden="true" />'), "the canvas is hidden from screen readers")
assert.ok(src.includes('<a className="mrf-link" href='), "links are real anchors")
assert.ok(src.includes("aria-label={s.label || SOCIAL_NAMES[s.icon]}"), "icon-only social links are named")
assert.ok(src.includes('<label className="mrf-sr" htmlFor={inputId}>'), "the email field has a label")
assert.ok(src.includes('aria-live="polite"'), "form feedback is announced")
assert.ok(src.includes('<h2 className="mrf-h">'), "the headline is a real heading")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Exclude<|Omit<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
const files = readdirSync(dir).sort()
assert.deepEqual(files, ["README.md", "demo-golden.tsx", "demo-scroll.tsx", "demo.tsx", "meadow-rise-footer.tsx"], "folder holds only the component, demos and README")
for (const f of files.filter((f) => f.startsWith("demo"))) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/meadow-rise-footer"], f + ": imports only the component")
  assert.match(d, /<div className="w-full">/, f + ": full width inside 21st's flex wrapper")
}
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/meadow-rise-footer"'), "tsconfig paths line exists")

// ---- scoped CSS ----
const css = src.match(/const MRF_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".mrf-")), "unscoped selector: " + sel)
}

// ---- scene ----
const a = src.indexOf("// #region scene\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "scene region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

assert.deepEqual(L.mrfHex("#253019"), [37, 48, 25])
assert.deepEqual(L.mrfHex("#fff"), [255, 255, 255])
assert.equal(L.mrfHex("rgba(0,0,0,.5)"), null, "non-hex colours fall back instead of breaking the scene")

const r1 = L.mrfRng(9)
const r2 = L.mrfRng(9)
for (let i = 0; i < 200; i++) {
  const v = r1()
  assert.equal(v, r2(), "rng is deterministic")
  assert.ok(v >= 0 && v < 1)
}
assert.equal(L.mrfEase(-1), 0)
assert.equal(L.mrfEase(2), 1)
assert.ok(L.mrfEase(0.3) > 0.3, "eases out")
assert.equal(L.mrfSmooth(0, 10, 5), 0.5)

const noise = L.mrfNoiseTable(3)
assert.equal(noise.length, 65536)
assert.ok(noise.every((v) => v >= 0 && v < 1), "noise in [0, 1)")
assert.ok(Math.abs(L.mrfSample(noise, 300.5, 40.5) - L.mrfSample(noise, 300.5 + 256, 40.5 + 256)) < 1e-6, "sampling tiles")
assert.ok(Math.abs(L.mrfSample(noise, 10.999, 3) - L.mrfSample(noise, 11, 3)) < 1e-3, "sampling is continuous")

// Ridges: far ones stand higher, every crest stays in the band, same seed same range.
const W = 1440
const H = 680
const n = 6
const specs = [...Array(n).keys()].map((i) => L.mrfLayerSpec(i, n, 3))
const mean = (i) => {
  let s = 0
  for (let x = 0; x < W; x += 8) s += L.mrfCrestAt(specs[i], x, W, H)
  return s / (W / 8)
}
for (let i = 1; i < n; i++) assert.ok(mean(i) > mean(i - 1), "ridge " + i + " sits lower than the one behind it")
for (let i = 0; i < n; i++) {
  for (let x = -40; x < W + 40; x += 5) {
    const y = L.mrfCrestAt(specs[i], x, W, H)
    assert.ok(Number.isFinite(y) && y > H * 0.25 && y < H * 1.05, "ridge " + i + " crest at " + x + " is " + y)
  }
}
assert.ok(mean(0) > H * 0.4, "the far range stays below the headline")
assert.deepEqual(L.mrfLayerSpec(2, n, 3), L.mrfLayerSpec(2, n, 3), "same seed, same ridge")
assert.notDeepEqual(L.mrfLayerSpec(2, n, 4), L.mrfLayerSpec(2, n, 3), "a new seed is a new ridge")
for (let x = 0; x < W; x += 13) {
  const v = L.mrfSeamAt(specs[2], x, W)
  assert.ok(v >= 0 && v <= 1)
}

// Light: a slope facing the sun is brighter than one facing away; faces stay in 0–1.
assert.ok(L.mrfShade(0.6, 0.1) > L.mrfShade(-0.6, 0.1), "sun-facing slopes are lit")
for (const m of [-2, -0.5, 0, 0.5, 2]) for (const t of [0, 0.3, 1]) {
  const v = L.mrfShade(m, t)
  assert.ok(v >= 0 && v <= 1)
}

// Painting: sky stays clear, grass is opaque, slicing by columns changes nothing.
const s = 1
const w = 200
const top = 300
const h = 260
const opts = { s, mx: 0, top, W: w, H, spec: specs[3], lit: [130, 154, 82], shadow: [85, 106, 51], haze: [227, 231, 220], noise, detailTo: top + 200 }
const whole = new Uint8ClampedArray(w * h * 4)
L.mrfPaintLayer(whole, w, h, opts)
const sliced = new Uint8ClampedArray(w * h * 4)
for (let c = 0; c < w; c += 37) L.mrfPaintLayer(sliced, w, h, opts, c, c + 37)
assert.deepEqual(sliced, whole, "painting in slices matches painting at once")
for (let c = 0; c < w; c += 9) {
  const crest = L.mrfCrestAt(specs[3], c + 0.5, w, H)
  const above = Math.floor(crest - top) - 2
  const below = Math.ceil(crest - top) + 2
  if (above >= 0) assert.equal(whole[(above * w + c) * 4 + 3], 0, "clear sky above the crest at column " + c)
  if (below < h) assert.equal(whole[(below * w + c) * 4 + 3], 255, "opaque grass below the crest at column " + c)
}
const last = whole[((h - 1) * w + 100) * 4 + 1]
assert.ok(last > 20 && last < 200, "deep grass keeps a sane green")

const band = L.mrfMistBand(noise, 64, 16)
assert.ok(band.every((v) => v >= 0 && v <= 1), "mist alpha in 0–1")
assert.ok(band.some((v) => v > 0.05), "the mist is not empty")

// Arrival: 0 as the footer enters, 1 once it has fully arrived, whatever its height.
assert.equal(L.mrfArrival(900, 1000, 900), 0)
assert.equal(L.mrfArrival(-100, 1000, 900), 1, "tall footer: arrived once its bottom meets the viewport")
assert.equal(L.mrfArrival(300, 600, 900), 1, "short footer: arrived once it is all on screen")
assert.ok(L.mrfArrival(450, 1000, 900) > 0.4 && L.mrfArrival(450, 1000, 900) < 0.6)

// ---- heading and form ----
assert.deepEqual(L.mrfParseHeading("Take the *first step*\nwith Serenica today."), [
  [
    { text: "Take", accent: false },
    { text: "the", accent: false },
    { text: "first", accent: true },
    { text: "step", accent: true },
  ],
  [
    { text: "with", accent: false },
    { text: "Serenica", accent: false },
    { text: "today.", accent: false },
  ],
])
assert.deepEqual(L.mrfParseHeading("plain"), [[{ text: "plain", accent: false }]])

for (const ok of ["kai@serenica.co", "a.b+c@mail.example.org", "  hi@x.io  "]) assert.ok(L.mrfIsEmail(ok), ok)
for (const bad of ["", "kai", "kai@", "kai@serenica", "@x.io", "a b@x.io", "kai@.io"]) assert.ok(!L.mrfIsEmail(bad), bad)

// ---- botany ----
const flowers = L.mrfBotany(3, 9)
assert.equal(flowers.length, 9)
assert.deepEqual(L.mrfBotany(3, 9), flowers, "deterministic")
for (const f of flowers) {
  assert.match(f.stem, /^M[\d.]+ 420Q/, "stems grow from the ground line")
  for (const d of [f.stem, ...f.parts]) assert.doesNotMatch(d, /NaN|Infinity|undefined/, "path is finite")
  assert.ok(f.order >= 0 && f.order <= 1)
}

console.log("meadow-rise-footer: ok")
