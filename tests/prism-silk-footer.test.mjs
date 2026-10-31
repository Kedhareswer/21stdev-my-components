// Install-safety and reveal/silk helper checks for prism-silk-footer.
// Run: node tests/prism-silk-footer.test.mjs
//
// The silk itself is a fragment shader and cannot be asserted here. What is
// checked is the part that fails silently: a fold that never finishes rising,
// grain that re-rolls at the display rate, a bad colour that turns the silk
// black, and the install rules every 21st component has to keep.
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/prism-silk-footer/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("prism-silk-footer.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|url\(/, "nothing fetched by the styles")
assert.match(src, /height = "\d+px"/, "height defaults to a definite length")
assert.match(src, /minHeight: height/, "the footer grows past its height instead of clipping links")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none"), "the canvas is guarded against Preflight")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("new ResizeObserver") && src.includes("new IntersectionObserver"), "resizes with its box and sleeps off-screen")
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "survives a lost context")
for (const gone of [
  "cancelAnimationFrame(raf)",
  "ro.disconnect()",
  "io.disconnect()",
  "mo.disconnect()",
  "gl.deleteProgram(program)",
  'root.removeEventListener("pointermove", onMove)',
  'root.removeEventListener("pointerdown", onDown)',
  'root.removeEventListener("pointerleave", onLeave)',
  'document.removeEventListener("visibilitychange", wake)',
]) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.ok(src.includes('<a className="psf-link" href='), "links are real anchors")
assert.ok(src.includes('<a className="psf-soc" href={s.href || "#"} aria-label={label}>'), "icon-only social links are named")
assert.ok(src.includes('<canvas ref={canvasRef} className="psf-canvas" aria-hidden="true" />'), "the canvas is hidden from screen readers")
assert.ok(src.includes('className="psf-fallback"'), "no WebGL2 still gets a picture of the silk")
assert.ok(src.includes('aria-label="Back to top"') && src.includes('aria-label="Send some love"'), "icon buttons are named")
assert.ok(src.includes('closest("a,button,input,textarea,select,label")'), "clicks on links never become ripples")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Exclude<|Omit<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
const files = readdirSync(dir).sort()
assert.deepEqual(files, ["README.md", "demo-nocturne.tsx", "demo-opal.tsx", "demo.tsx", "prism-silk-footer.tsx"], "folder holds only the component, demos and README")
for (const f of files.filter((f) => f.startsWith("demo"))) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/prism-silk-footer"], f + ": imports only the component")
  assert.match(d, /className="w-full"/, f + ": full width inside 21st's flex wrapper")
}
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/prism-silk-footer"'), "tsconfig paths line exists")

// ---- scoped CSS ----
const css = src.match(/const PSF_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".psf-")), "unscoped selector: " + sel)
}

// ---- every preset colour the shader reads is a hex it can parse ----
const presets = src.slice(src.indexOf("const PRESETS"), src.indexOf("const DEFAULT_COLUMNS"))
for (const key of ["paperTop", "paperLow", "glow"]) {
  for (const m of presets.matchAll(new RegExp(key + ': "([^"]*)"', "g"))) assert.match(m[1], /^#[0-9a-f]{6}$/, key + " " + m[1])
}
for (const m of presets.matchAll(/silk: \[([^\]]*)\]/g)) {
  const list = [...m[1].matchAll(/"([^"]*)"/g)].map((x) => x[1])
  assert.equal(list.length, 5, "five silk colours per preset")
  for (const c of list) assert.match(c, /^#[0-9a-f]{6}$/, "silk " + c)
}

// ---- the helpers ----
const a = src.indexOf("// #region silk\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "silk region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

assert.deepEqual(L.psfHex("#ff0000"), [1, 0, 0])
assert.deepEqual(L.psfHex("#0f0"), [0, 1, 0])
assert.deepEqual(L.psfHex("  00F "), [0, 0, 1])
assert.equal(L.psfHex("tomato"), null, "named colours are rejected, not NaN")
assert.equal(L.psfHex(""), null)

const fb = ["#111111", "#222222", "#333333", "#444444", "#555555"]
assert.deepEqual(L.psfFive(undefined, fb), fb, "no list is the preset")
assert.deepEqual(L.psfFive(["#ff0000", "#00ff00"], fb), ["#ff0000", "#00ff00", "#ff0000", "#00ff00", "#ff0000"], "short lists cycle")
assert.deepEqual(L.psfFive(["#a", "nope", "#abc"], fb), ["#abc", "#abc", "#abc", "#abc", "#abc"], "bad entries are dropped")
assert.deepEqual(L.psfFive(["red"], fb), fb, "a list of nothing usable falls back")
assert.equal(L.psfFive(Array(9).fill("#123456"), fb).length, 5, "long lists are cut")

assert.equal(L.psfEaseBack(0), 0)
assert.equal(L.psfEaseBack(1), 1, "ends exactly at rest")
assert.equal(L.psfEaseBack(-2), 0, "clamped below")
assert.equal(L.psfEaseBack(3), 1, "clamped above")
let peak = 0
for (let t = 0; t <= 1; t += 0.01) peak = Math.max(peak, L.psfEaseBack(t))
assert.ok(peak > 1.02 && peak < 1.15, "the cloth overshoots a little, not a lot: " + peak)

// The folds: all down before the reveal, all at rest after it, back ones first.
for (let i = 0; i < 5; i++) {
  assert.equal(L.psfLayerRise(0, i, 5), 0, "fold " + i + " starts down")
  assert.equal(L.psfLayerRise(1, i, 5), 1, "fold " + i + " ends at rest")
}
const firstMove = (i) => {
  for (let r = 0; r <= 1; r += 0.001) if (L.psfLayerRise(r, i, 5) > 0.01) return r
  return 2
}
const starts = [0, 1, 2, 3, 4].map(firstMove)
for (let i = 1; i < 5; i++) assert.ok(starts[i] > starts[i - 1] + 0.05, "fold " + i + " starts after fold " + (i - 1))
assert.ok(starts[4] < 0.6, "the nearest fold is moving by mid-reveal")
for (const r of [0.2, 0.3]) {
  for (let i = 1; i < 5; i++) assert.ok(L.psfLayerRise(r, i, 5) <= L.psfLayerRise(r, i - 1, 5), "early on, fold " + i + " is behind fold " + (i - 1))
}
assert.equal(L.psfLayerRise(1, 0, 1), 1, "a single fold still finishes")

const frames = new Set()
for (let i = 0; i < 120; i++) frames.add(L.psfGrainFrame(i / 120, 24))
assert.equal(frames.size, 24, "one second at 24 fps is 24 grain frames")
assert.equal(L.psfGrainFrame(5, 0), 0, "fps 0 freezes the grain")
assert.equal(L.psfGrainFrame(NaN, 24), 0, "a bad clock is a still frame")
assert.equal(L.psfGrainFrame(-1, 24), 0)
for (const t of [0, 1e3, 1e6]) assert.ok(L.psfGrainFrame(t, 60) < 997, "frame index stays small at t=" + t)

assert.equal(L.psfApproach(0, 1, 0, 5), 0, "no time, no movement")
assert.ok(L.psfApproach(0, 1, 0.016, 5) > 0 && L.psfApproach(0, 1, 0.016, 5) < 1)
assert.equal(L.psfApproach(0, 1, 5, 5), L.psfApproach(0, 1, 0.1, 5), "a long stall is clamped, never a jump")
assert.ok(Math.abs(L.psfApproach(0, 1, 0.1, 1e4) - 1) < 1e-9, "a huge rate snaps")

const hues = [0, 1, 2, 3].map((i) => L.psfColumnHue(i, 4))
assert.equal(new Set(hues).size, 4, "every column has its own tint")
assert.ok(hues.every((h) => h !== 0 && Math.abs(h) <= 0.36), "tints stay inside the palette swing and never equal rest")
for (let n = 1; n < 7; n++) for (let i = 0; i < n; i++) assert.notEqual(L.psfColumnHue(i, n), 0, n + " columns, column " + i)
assert.equal(L.psfColumnHue(0, 0), 0)

assert.equal(L.psfStageHeight(760, 460), 300)
assert.equal(L.psfStageHeight(500, 480), 80, "never collapses to nothing")

console.log("prism-silk-footer: ok")
