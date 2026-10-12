// Install-safety and flock checks for murmuration-wordmark.
// Run: node tests/murmuration-wordmark.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/murmuration-wordmark/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("murmuration-wordmark.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|https?:\/\//, "nothing fetched")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none"), "the canvas is guarded against Preflight")
assert.ok(src.includes("new ResizeObserver") && src.includes("IntersectionObserver"), "resizes with its box and sleeps off-screen")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", 'root.removeEventListener("pointermove", onMove)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.ok(src.includes('className="mmw-sr"'), "the word is readable as text")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src, /colors\.sun \+ "/, "no hex-suffix alpha: it breaks on #rgb and named colours")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
for (const f of ["demo.tsx", "demo-dawn.tsx"]) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/murmuration-wordmark"], f + ": imports only the component")
  assert.doesNotMatch(d, /https?:\/\//, f + ": no external assets")
  assert.match(d, /className="w-full"/, f + ": full width inside 21st's flex wrapper")
}

// ---- scoped CSS ----
const css = src.match(/const MMW_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@")) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".mmw-")), "unscoped selector: " + sel)
}

// ---- flock ----
const a = src.indexOf("// #region flock\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "flock region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

// The current is a curl, so it is divergence-free: it folds the flock without
// piling birds into a point or tearing holes in it. Check numerically.
const eps = 1e-4
for (const [x, y, t] of [[0.1, -0.3, 0], [0.7, 0.2, 3.1], [-0.5, 0.45, 9.7], [0, 0, 1.2]]) {
  const dvx = (L.mmwCurl(x + eps, y, t)[0] - L.mmwCurl(x - eps, y, t)[0]) / (2 * eps)
  const dvy = (L.mmwCurl(x, y + eps, t)[1] - L.mmwCurl(x, y - eps, t)[1]) / (2 * eps)
  assert.ok(Math.abs(dvx + dvy) < 1e-5, "divergence-free at " + [x, y, t])
  assert.ok(L.mmwCurl(x, y, t).every(Number.isFinite))
}

// The centre wanders but stays on screen.
for (let t = 0; t < 600; t += 0.37) {
  const c = L.mmwCentre(t)
  assert.ok(Math.abs(c[0]) <= 0.55 && Math.abs(c[1]) <= 0.3, "centre stays in frame at t=" + t)
}

assert.equal(L.mmwEase(0), 0)
assert.equal(L.mmwEase(1), 1)
assert.equal(L.mmwEase(-2), 0)
assert.equal(L.mmwEase(0.5), 0.5)

// Every bird gets a real target; every target gets used when there are enough birds.
const as = L.mmwAssign(1000, 300, 23)
assert.equal(as.length, 1000)
assert.ok(Array.from(as).every((v) => v >= 0 && v < 300))
assert.equal(new Set(as).size, 300, "every point in the word is flown to")
assert.deepEqual(Array.from(L.mmwAssign(10, 0, 1)), new Array(10).fill(-1), "no word, no targets")
assert.deepEqual(Array.from(L.mmwAssign(50, 40, 7)), Array.from(L.mmwAssign(50, 40, 7)), "deterministic for a seed")
// Shuffled: the first birds do not just take the first points in order.
const ordered = Array.from(L.mmwAssign(40, 40, 9)).filter((v, i) => v === i).length
assert.ok(ordered < 10, "the word fills in from everywhere, not left to right")

assert.equal(L.mmwAlpha("#ffd2a0", 0.5), "rgba(255,210,160,0.5)")
assert.equal(L.mmwAlpha("#fff", 0), "rgba(255,255,255,0)")
assert.equal(L.mmwAlpha("tomato", 0.4), "tomato", "a named colour passes through")

console.log("murmuration-wordmark: ok")
