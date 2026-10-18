// Install-safety and lettering checks for animator-title-preloader.
// Run: node tests/animator-title-preloader.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/animator-title-preloader/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("animator-title-preloader.tsx")

// ---- install safety ----
assert.ok(src.startsWith('"use client"'), "client component")
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|https?:\/\//, "nothing fetched")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes(".atp-stage svg { max-width: none; }"), "inline SVG is guarded against Preflight")
assert.ok(src.includes('role="progressbar"') && src.includes("aria-valuenow={final ? 100 : pct}"), "reports progress")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.ok(src.includes("cancelAnimationFrame(raf)") && src.includes("ro.disconnect()"), "cleans up its loop and observer")
assert.ok(src.includes("React.useId()"), "SVG ids are unique per instance")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
// A <use> clone of the animated rough makes Chrome re-filter the painted hands
// every frame (60fps -> 8fps). The ghost must stay real paths.
assert.ok(!/<use\s+(href|xlinkHref)/.test(src), "no <use> clones")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full on any element")

const demos = ["demo.tsx", "demo-dusk.tsx", "demo-paper.tsx", "demo-gate.tsx"]
for (const f of demos) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]).filter((m) => m !== "react")
  assert.deepEqual(di, ["@/components/ui/animator-title-preloader"], f + ": imports only the component")
  assert.doesNotMatch(d, /https?:\/\//, f + ": no external assets")
  assert.doesNotMatch(d, /Abhishek/i, f + ": no names from the reference")
}
assert.match(read("demo.tsx"), /<AnimatorTitlePreloader loop \/>/, "default demo is the bare looping component")
assert.doesNotMatch(src, /Abhishek/i, "no names from the reference")

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(
  tsconfig.includes('"@/components/ui/animator-title-preloader": ["./components/animator-title-preloader/animator-title-preloader.tsx"]'),
  "tsconfig paths line for npm run check",
)

// ---- scoped CSS ----
const css = src.match(/const ATP_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".atp-")), "unscoped selector: " + sel)
}

// ---- lettering ----
const a = src.indexOf("// #region lettering\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "lettering region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

// The simulated load runs 0 → 100 and never backwards, with real stalls on the way.
assert.equal(L.atpSimulated(0), 0)
assert.equal(L.atpSimulated(1), 100)
let prev = -1
let flat = 0
for (let i = 0; i <= 1000; i++) {
  const v = L.atpSimulated(i / 1000)
  assert.ok(v >= prev - 1e-9 && v >= 0 && v <= 100, "monotonic at t=" + i / 1000)
  if (i && v - prev < 0.02) flat++
  prev = v
}
assert.ok(flat > 40, "the load stalls now and then: " + flat)
assert.ok(L.atpSimulated(0.1) > 10, "a quick start, so the stage is never empty for long")

// Both fonts decode to all 94 printable glyphs, every one with strokes.
const script = L.atpDecode(L.ATP_SCRIPT)
const sans = L.atpDecode(L.ATP_SANS)
assert.equal(script.length, 94)
assert.equal(sans.length, 94)
for (const g of [...script, ...sans]) {
  assert.ok(g.half > 0 && g.strokes.length > 0, "glyph has strokes")
  for (const s of g.strokes) assert.ok(s.length >= 2 && s.length % 2 === 0, "strokes are x,y pairs")
}
// "P" in the sans: a stem from cap height to the baseline.
const P = sans["P".charCodeAt(0) - 33]
const ys = P.strokes.flatMap((s) => s.filter((_, i) => i % 2))
assert.equal(Math.min(...ys), 1)
assert.equal(Math.max(...ys), 22)

// Layout: deterministic for a seed, wobbly across seeds, one line of sane size.
const opts = { seed: 3, jitter: 0.3, condense: 0.86, tracking: 0.3, space: 9, capGap: 2 }
const l1 = L.atpLayout("An Animation", script, opts)
const l2 = L.atpLayout("An Animation", script, opts)
const l3 = L.atpLayout("An Animation", script, { ...opts, seed: 4 })
assert.deepEqual(l1.strokes, l2.strokes, "same seed, same hand")
assert.notDeepEqual(l1.strokes, l3.strokes, "another seed, another hand")
assert.equal(l1.strokes.length, l1.lengths.length)
assert.ok(l1.lengths.every((n) => n > 0), "every stroke has length")
assert.ok(l1.y1 - l1.y0 > 18 && l1.y1 - l1.y0 < 40, "one line tall: " + (l1.y1 - l1.y0))
assert.ok(l1.x1 - l1.x0 > 100 && l1.x1 - l1.x0 < 260, "a line wide: " + (l1.x1 - l1.x0))
assert.ok(L.atpLayout("Ab", script, opts).x1 < L.atpLayout("Ab Cd", script, opts).x1, "longer text runs further")
assert.equal(L.atpLayout("", script, opts).strokes.length, 0, "empty text lays out nothing")

assert.equal(L.atpSupported("Kedhareswer"), true)
assert.equal(L.atpSupported("José"), false, "non-ASCII falls back to a system script face")

// The nib: one closed quad per segment, all wound the same way.
const pts = [0, 0, 10, 0, 10, 10, 0, 12]
const nib = L.atpNib(pts, 0.8, -0.6)
assert.equal((nib.match(/M/g) || []).length, 3)
assert.equal((nib.match(/Z/g) || []).length, 3)
const quads = nib.split("Z").filter(Boolean).map((q) => q.replace(/[ML]/g, " ").trim().split(/\s+/).map(Number))
const signs = quads.map((q) => {
  let area = 0
  for (let i = 0; i < 8; i += 2) area += q[i] * q[(i + 3) % 8] - q[(i + 2) % 8] * q[i + 1]
  return Math.sign(area)
})
assert.ok(signs.every((s) => s === signs[0]), "consistent winding, so nonzero fill unions the stroke")
assert.equal(L.atpPath([1, 2, 3, 4]), "M1 2L3 4")
assert.equal(L.atpPath([1, 2]), "M1 2l0.01 0", "a dot still paints with round caps")

// Pipeline: each letter is inked before it is painted, left to right.
let lastInk = -1
for (let i = 0; i < 9; i++) {
  const beat = L.atpBeats(i, 9)
  assert.ok(beat.ink < beat.paint, "ink before paint")
  assert.ok(beat.ink > lastInk, "left to right")
  assert.ok(beat.ink >= 34 && beat.paint <= 90, "inside the ink and paint stages")
  lastInk = beat.ink
}
assert.deepEqual(L.atpBeats(0, 1), { ink: 34, paint: 50 }, "a one-letter title still lands")
assert.deepEqual([0, 33, 34, 49, 50, 99, 100].map(L.atpStage), [0, 0, 1, 1, 2, 2, 3])
assert.deepEqual(L.atpFrame(50, 120), { frame: "0060", total: "0120" })
assert.deepEqual(L.atpFrame(100, 24000), { frame: "24000", total: "24000" })
assert.deepEqual(L.atpFrame(-5, 120).frame, "0000")
assert.deepEqual(L.atpHex("#27e1f2", [0, 0, 0]), [39, 225, 242])
assert.deepEqual(L.atpHex("cyan", [1, 2, 3]), [1, 2, 3], "a named colour falls back")

console.log("animator-title-preloader: ok")
