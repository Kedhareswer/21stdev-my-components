// Install-safety and pattern checks for rangoli-preloader.
// Run: node tests/rangoli-preloader.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/rangoli-preloader/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("rangoli-preloader.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|https?:\/\//, "nothing fetched")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none"), "the canvas is guarded against Preflight")
assert.ok(src.includes('role="progressbar"') && src.includes("aria-valuenow={pct}"), "reports progress")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.ok(src.includes("cancelAnimationFrame(raf)") && src.includes("ro.disconnect()"), "cleans up its loop and observer")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src, /rgp-tl\b|rgp-bl\b|\blamp\(/, "no top-left label, caption or lamp")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
for (const f of ["demo.tsx", "demo-slate.tsx"]) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/rangoli-preloader"], f + ": imports only the component")
  assert.doesNotMatch(d, /https?:\/\//, f + ": no external assets")
}
assert.match(read("demo.tsx"), /<RangoliPreloader loop \/>/, "default demo is the bare looping component")

// ---- scoped CSS ----
const css = src.match(/const RGP_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".rgp-")), "unscoped selector: " + sel)
}

// ---- pattern ----
const a = src.indexOf("// #region pattern\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "pattern region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

// The simulated load runs 0 → 100 and never backwards.
assert.equal(L.rgpSimulated(0), 0)
assert.equal(L.rgpSimulated(1), 100)
let prev = -1
for (let i = 0; i <= 1000; i++) {
  const v = L.rgpSimulated(i / 1000)
  assert.ok(v >= prev - 1e-9 && v >= 0 && v <= 100, "monotonic at t=" + i / 1000)
  prev = v
}

// Same seed, same grains; another seed, other grains.
const g1 = L.rgpBuild(8, 4000, 7)
const g2 = L.rgpBuild(8, 4000, 7)
const g3 = L.rgpBuild(8, 4000, 8)
assert.ok(g1.count > 2000, "a real amount of powder: " + g1.count)
assert.equal(g1.count, g2.count)
assert.deepEqual(Array.from(g1.xs.slice(0, 50)), Array.from(g2.xs.slice(0, 50)), "deterministic for a seed")
assert.notDeepEqual(Array.from(g1.xs.slice(0, 50)), Array.from(g3.xs.slice(0, 50)), "a new seed reshuffles")

// Every grain sits inside the pattern's outer necklace and uses a real colour slot.
let maxR = 0
const used = new Set()
for (let i = 0; i < g1.count; i++) {
  maxR = Math.max(maxR, Math.hypot(g1.xs[i], g1.ys[i]))
  used.add(g1.slot[i])
}
assert.ok(maxR <= 1.03, "nothing outside the pattern: " + maxR)
assert.deepEqual([...used].sort(), [0, 1, 2, 3, 4, 5, 6], "all seven powders appear")

// Pour order runs from the centre outward: the first tenth of grains is nearer
// the middle than the last tenth.
const meanR = (from, to) => {
  let s = 0
  for (let i = from; i < to; i++) s += Math.hypot(g1.xs[i], g1.ys[i])
  return s / (to - from)
}
const tenth = Math.floor(g1.count / 10)
assert.ok(meanR(0, tenth) < 0.3 && meanR(g1.count - tenth, g1.count) > 0.6, "pours from the centre outward")

// Symmetry: rotating every grain by one fold lands on powder of the same colour
// (checked on a coarse grid, which tolerates the jitter).
const grid = (g, rot) => {
  const m = new Map()
  for (let i = 0; i < g.count; i++) {
    const c = Math.cos(rot)
    const s = Math.sin(rot)
    const x = g.xs[i] * c - g.ys[i] * s
    const y = g.xs[i] * s + g.ys[i] * c
    const key = Math.round(x * 12) + "," + Math.round(y * 12)
    m.set(key, (m.get(key) || 0) + 1)
  }
  return m
}
const dense = L.rgpBuild(8, 20000, 3)
const base = grid(dense, 0)
const turned = grid(dense, (Math.PI * 2) / 8)
let shared = 0
for (const k of base.keys()) if (turned.has(k)) shared++
assert.ok(shared / base.size > 0.85, "the pattern repeats every fold: " + (shared / base.size).toFixed(2))

// Folds outside 6 / 8 / 12 fall back to 8.
assert.equal(L.rgpBuild(5, 3000, 1).count, L.rgpBuild(8, 3000, 1).count)

assert.equal(L.rgpLens(0, 1), 0)
assert.equal(L.rgpLens(1, 1), 0)
assert.ok(Math.abs(L.rgpLens(0.5, 0.1) - 0.1) < 1e-9, "widest at the middle")
assert.ok(L.rgpSpike(0.05, 0.1) > L.rgpSpike(0.9, 0.1), "spikes taper to a point")
assert.deepEqual(L.rgpHex("#f59e1b", [0, 0, 0]), [245, 158, 27])
assert.deepEqual(L.rgpHex("marigold", [1, 2, 3]), [1, 2, 3], "a named colour falls back")

console.log("rangoli-preloader: ok")
