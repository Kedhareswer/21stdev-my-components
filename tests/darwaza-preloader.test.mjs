// Install-safety and geometry checks for darwaza-preloader.
// Run: node tests/darwaza-preloader.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/darwaza-preloader/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("darwaza-preloader.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|https?:\/\//, "nothing fetched")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none") && src.includes('maxWidth: "none"'), "SVGs are guarded against Preflight")
assert.ok(src.includes('role="progressbar"') && src.includes("aria-valuenow={pct}"), "reports progress")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.ok(src.includes("cancelAnimationFrame(raf)") && src.includes("ro.disconnect()"), "cleans up its loop and observer")
assert.ok(src.includes("clearTimeout(t)"), "clears its phase timers")
assert.ok(src.includes("React.useId()"), "SVG ids are unique per instance")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
for (const f of ["demo.tsx", "demo-gate.tsx", "demo-neel.tsx"]) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.ok(di.includes("@/components/ui/darwaza-preloader"), f + ": imports the component by its installed path")
  assert.ok(di.every((p) => p === "react" || p === "@/components/ui/darwaza-preloader"), f + ": nothing else")
  assert.doesNotMatch(d, /https?:\/\//, f + ": no external assets")
}
assert.match(read("demo.tsx"), /<DarwazaPreloader loop \/>/, "default demo is the bare looping component")

// ---- scoped CSS ----
const css = src.match(/const DWZ_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".dwz-")), "unscoped selector: " + sel)
}

// ---- geometry ----
const a = src.indexOf("// #region geometry\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "geometry region missing")
// The region reads the stage constants declared above it.
const head = src.slice(src.indexOf("const SW = "), src.indexOf("const PRESENT_MS"))
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(head + src.slice(a, b))))

// The simulated load runs 0 → 100 and never backwards.
assert.equal(L.dwzSimulated(0), 0)
assert.equal(L.dwzSimulated(1), 100)
let prev = -1
for (let i = 0; i <= 1000; i++) {
  const v = L.dwzSimulated(i / 1000)
  assert.ok(v >= prev - 1e-9 && v >= 0 && v <= 100, "monotonic at t=" + i / 1000)
  prev = v
}

// The wet edge starts below the floor and finishes at the top of the frame, rising steadily.
assert.ok(L.dwzPaintY(0) > 1200, "nothing painted at 0")
assert.equal(L.dwzPaintY(100), 150, "fully painted at 100")
assert.equal(L.dwzPaintY(-5), L.dwzPaintY(0))
assert.equal(L.dwzPaintY(140), L.dwzPaintY(100))
assert.ok(L.dwzPaintY(30) > L.dwzPaintY(60), "rises with progress")

// The arch: floor, left jamb, one arc per lobe, right jamb, closed.
const arch = L.dwzArch(200, 800, 600, 320, 1200, 9)
assert.ok(arch.startsWith("M200 1200 L200 600"), "starts at the left foot")
assert.equal((arch.match(/ A/g) || []).length, 9, "one foil per lobe")
assert.ok(arch.endsWith("L800 1200 Z"), "ends at the right foot")
assert.doesNotMatch(arch, /NaN|e-/, "plain numbers only")
// Every foil endpoint lies on the half-ellipse, and the apex sits at ya.
const ends = [...arch.matchAll(/ A[\d.]+ [\d.]+ 0 0 0 ([\d.]+) ([\d.]+)/g)].map((m) => [+m[1], +m[2]])
for (const [x, y] of ends) {
  const e = ((x - 500) / 300) ** 2 + ((600 - y) / 280) ** 2
  assert.ok(Math.abs(e - 1) < 0.01, "foil point on the envelope: " + x + "," + y)
}
assert.ok(Math.min(...ends.map((p) => p[1])) >= 320 - 0.01, "nothing above the apex")
// The opening grows outward with its pad.
assert.ok(L.dwzOpening(42).startsWith("M158 "), "a padded opening widens the jamb")

// Fit: the stage stays inside the root and centred.
for (const [w, h] of [[1440, 900], [390, 844], [1920, 1080], [800, 1400]]) {
  const f = L.dwzFit(w, h)
  assert.ok(1000 * f.k <= w + 0.01 && 1200 * f.k <= h + 0.01, "fits " + w + "x" + h)
  assert.ok(Math.abs(f.ox * 2 + 1000 * f.k - w) < 0.01, "centred across")
  // The push zoom carries the opening past every edge.
  const z = L.dwzZoom(w, h, f.k)
  assert.ok(600 * f.k * z >= w && 880 * f.k * z >= h, "push clears the screen at " + w + "x" + h)
}

// The title shrinks for long lines and never past legibility.
assert.equal(L.dwzTitleSize(15), 58)
assert.ok(L.dwzTitleSize(20) < 58 && L.dwzTitleSize(20) * 20 <= 870 + 1e-9)
assert.equal(L.dwzTitleSize(200), 26)

assert.deepEqual(L.dwzHex("#e2176f", [0, 0, 0]), [226, 23, 111])
assert.deepEqual(L.dwzHex("pink", [1, 2, 3]), [1, 2, 3], "a named colour falls back")
assert.equal(L.dwzShade("#808080", 0), "rgb(128,128,128)")
assert.equal(L.dwzShade("#808080", 1), "rgb(255,255,255)")
assert.equal(L.dwzShade("#808080", -1), "rgb(0,0,0)")
assert.equal(L.dwzN(1.23456), "1.23")

console.log("darwaza-preloader: ok")
