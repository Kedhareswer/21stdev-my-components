// Install-safety and timeline checks for weight-sweep-preloader.
// Run: node tests/weight-sweep-preloader.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/weight-sweep-preloader/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("weight-sweep-preloader.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|https?:\/\//, "nothing fetched: faces come from the host or the fallback stacks")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"') && src.includes("aria-valuenow="), "reports progress to assistive tech")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
for (const f of ["demo.tsx", "demo-ink.tsx"]) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/weight-sweep-preloader"], f + ": imports only the component")
  assert.doesNotMatch(d, /https?:\/\//, f + ": no external assets")
}
assert.match(read("demo.tsx"), /<WeightSweepPreloader loop \/>/, "default demo is the bare looping component")

// ---- scoped CSS ----
const css = src.match(/const WSP_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".wsp-")), "unscoped selector: " + sel)
}

// ---- timeline ----
const a = src.indexOf("// #region timeline\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "timeline region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

assert.equal(L.wspSimulated(0), 0, "starts at 0")
assert.equal(L.wspSimulated(1), 100, "ends at exactly 100")
assert.equal(L.wspSimulated(-1), 0)
assert.equal(L.wspSimulated(2), 100)
let prev = -1
for (let i = 0; i <= 1000; i++) {
  const v = L.wspSimulated(i / 1000)
  assert.ok(v >= prev - 1e-9, "the simulated load never runs backwards (t=" + i / 1000 + ")")
  assert.ok(v >= 0 && v <= 100)
  prev = v
}
assert.equal(L.wspWeight(0, 100, 900), 100, "hairline at 0")
assert.equal(L.wspWeight(100, 100, 900), 900, "black at 100")
assert.equal(L.wspWeight(50, 100, 900), 500)
assert.equal(L.wspWeight(150, 100, 900), 900, "clamped above")
assert.equal(L.wspWeight(50, 200, 800), 500)
assert.ok(L.wspTracking(900) < L.wspTracking(100), "black sits tighter than hairline")
assert.equal(L.wspTicks(0, 40), 0)
assert.equal(L.wspTicks(100, 40), 40)
assert.equal(L.wspTicks(50, 40), 20)
assert.equal(L.wspPad(0), "000")
assert.equal(L.wspPad(7.9), "007")
assert.equal(L.wspPad(64), "064")
assert.equal(L.wspPad(100), "100")
assert.equal(L.wspPad(140), "100")

console.log("weight-sweep-preloader: ok")
