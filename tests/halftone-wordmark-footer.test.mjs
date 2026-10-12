// Install-safety and halftone/physics checks for halftone-wordmark-footer.
// Run: node tests/halftone-wordmark-footer.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/halftone-wordmark-footer/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("halftone-wordmark-footer.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|https?:\/\//, "nothing fetched")
assert.match(src, /height = "\d+px"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none"), "the canvas is guarded against Preflight")
assert.ok(src.includes("new ResizeObserver") && src.includes("IntersectionObserver"), "resizes with its box and sleeps off-screen")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", 'root.removeEventListener("pointermove", onMove)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.ok(src.includes("<a href="), "links are real anchors")
assert.ok(src.includes('className="hwf-sr"'), "the wordmark is readable as text")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
for (const f of ["demo.tsx", "demo-paper.tsx"]) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/halftone-wordmark-footer"], f + ": imports only the component")
  assert.doesNotMatch(d, /https?:\/\//, f + ": no external assets")
  assert.match(d, /className="w-full"/, f + ": full width inside 21st's flex wrapper")
}

// ---- scoped CSS ----
const css = src.match(/const HWF_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".hwf-")), "unscoped selector: " + sel)
}

// ---- halftone and physics ----
const a = src.indexOf("// #region halftone\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "halftone region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

assert.deepEqual(L.hwfHex("#e9762b"), [233, 118, 43])
assert.deepEqual(L.hwfHex("#fff"), [255, 255, 255])
assert.equal(L.hwfHex("tomato"), null, "named colours fall back instead of breaking the mix")
assert.equal(L.hwfRadius(0, 6), 0)
assert.ok(Math.abs(L.hwfRadius(1, 6) - 3.36) < 1e-9, "a full cell is just over half the gap, so dots almost touch")
assert.ok(Math.abs(L.hwfRadius(0.25, 6) * 2 - L.hwfRadius(1, 6)) < 1e-9, "area-true: a quarter cover is half the radius")
assert.equal(L.hwfRadius(2, 6), L.hwfRadius(1, 6), "coverage is clamped")

// A dot inside the pointer radius is pushed away from it.
let s = L.hwfStep(100, 100, 0, 0, 100, 100, 90, 100, 80)
assert.ok(s[0] > 100, "pushed away from a pointer on its left")
// Away from the pointer, a displaced dot comes home and stops.
s = [140, 70, 6, -4]
for (let i = 0; i < 400; i++) s = L.hwfStep(s[0], s[1], s[2], s[3], 100, 100, -1e5, -1e5, 80)
assert.ok(Math.hypot(s[0] - 100, s[1] - 100) < 0.05 && Math.hypot(s[2], s[3]) < 0.05, "settles home on its spring")
// A pointer parked on a dot never sends it to infinity.
s = [100, 100, 0, 0]
for (let i = 0; i < 400; i++) s = L.hwfStep(s[0], s[1], s[2], s[3], 100, 100, 100, 100, 80)
assert.ok(s.every(Number.isFinite) && Math.hypot(s[0] - 100, s[1] - 100) < 80, "a parked pointer holds the dot at a bounded distance")

assert.equal(L.hwfWarmth(100, 100, 100, 100, 28), 0, "cold at home")
assert.equal(L.hwfWarmth(140, 100, 100, 100, 28), 1, "fully warm once well off home")
assert.ok(Math.abs(L.hwfWarmth(114, 100, 100, 100, 28) - 0.5) < 1e-9)
assert.equal(L.hwfFitSize(400, 800), 200, "fit doubles the 100px size to fill twice the width")
assert.equal(L.hwfFitSize(0, 800), 0)

console.log("halftone-wordmark-footer: ok")
