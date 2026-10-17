// Install-safety and timeline checks for type-remix-preloader.
// Run: node tests/type-remix-preloader.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/type-remix-preloader/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("type-remix-preloader.tsx")

// ---- install safety ----
assert.deepEqual(
  readdirSync(dir).sort(),
  ["README.md", "demo-gate.tsx", "demo-showreel.tsx", "demo.tsx", "type-remix-preloader.tsx"],
  "the folder ships the component, its demos and a README, nothing else",
)
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('document.createElement("link")'), "fonts arrive by an injected link")
assert.ok(src.includes("if (!fontHref)"), "fontHref={null} loads nothing")
for (const url of src.matchAll(/https?:\/\/[^"'\s)]+/g))
  assert.match(url[0], /^https:\/\/fonts\.googleapis\.com\/|^http:\/\/www\.w3\.org\/2000\/svg/, "unexpected external URL: " + url[0])
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"') && src.includes("aria-valuenow="), "reports progress to assistive tech")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.ok((src.match(/maxWidth: "none"/g) || []).length >= 6, "SVGs guard Preflight's max-width")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|ReturnType<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "no generic hook type arguments")

for (const f of ["demo.tsx", "demo-gate.tsx", "demo-showreel.tsx"]) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]).filter((m) => m !== "react")
  assert.deepEqual(di, ["@/components/ui/type-remix-preloader"], f + ": imports only the component")
  assert.doesNotMatch(d, /https?:\/\//, f + ": no external assets")
}
assert.match(read("demo.tsx"), /<TypeRemixPreloader loop \/>/, "default demo is the bare looping component")

// ---- scoped CSS ----
const css = src.match(/const RTP_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".rtp-")), "unscoped selector: " + sel)
}
for (const k of css.matchAll(/@keyframes ([\w-]+)/g)) assert.ok(k[1].startsWith("rtp-"), "unprefixed keyframes: " + k[1])

// ---- timeline ----
const a = src.indexOf("// #region timeline\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "timeline region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

assert.equal(L.rtpSimulated(0), 0, "starts at 0")
assert.equal(L.rtpSimulated(1), 100, "ends at exactly 100")
assert.equal(L.rtpSimulated(-1), 0)
assert.equal(L.rtpSimulated(2), 100)
let prev = -1
for (let i = 0; i <= 1000; i++) {
  const v = L.rtpSimulated(i / 1000)
  assert.ok(v >= prev - 1e-9, "the simulated load never runs backwards (t=" + i / 1000 + ")")
  assert.ok(v >= 0 && v <= 100)
  prev = v
}

assert.equal(L.rtpTakeAt(0, 7), 0)
assert.equal(L.rtpTakeAt(14, 7), 0)
assert.equal(L.rtpTakeAt(15, 7), 1)
assert.equal(L.rtpTakeAt(86, 7), 6, "the last take arrives before 100 so the count lands on it")
assert.equal(L.rtpTakeAt(100, 7), 6)
assert.equal(L.rtpTakeAt(150, 7), 6)
assert.equal(L.rtpTakeAt(50, 1), 0)

assert.deepEqual(L.rtpSplit("PORTFOLIO"), ["PORT", "FOLIO"])
assert.deepEqual(L.rtpSplit("SHOWREEL"), ["SHOW", "REEL"])
assert.deepEqual(L.rtpSplit("  my   work "), ["my", "work"], "breaks at a space, collapsing runs")
assert.deepEqual(L.rtpSplit("ART"), ["ART", ""], "short words stay on one line")
assert.equal(L.rtpTitle("PORTFOLIO"), "Portfolio")
assert.equal(L.rtpTitle("MY WORK"), "My Work")
assert.equal(L.rtpFindO("PORT"), 1)
assert.equal(L.rtpFindO("SHOW"), 2)
assert.equal(L.rtpFindO("ART"), -1)
assert.equal(L.rtpPad(0), "000")
assert.equal(L.rtpPad(7.9), "007")
assert.equal(L.rtpPad(100), "100")
assert.equal(L.rtpPad(140), "100")
assert.equal(L.rtpTwo(3), "03")

assert.equal(L.rtpShade("#ffffff", 0.5), "#808080")
assert.equal(L.rtpShade("#fff", 0), "#ffffff")
assert.equal(L.rtpShade("#ff8a1e", 1), "#000000")
assert.equal(L.rtpShade("tomato", 0.5), "tomato", "non-hex colours pass through")

const r1 = L.rtpRand(42), r2 = L.rtpRand(42)
for (let i = 0; i < 20; i++) {
  const v = r1()
  assert.equal(v, r2(), "the PRNG is deterministic")
  assert.ok(v >= 0 && v < 1)
}
assert.equal(L.rtpJag(3), L.rtpJag(3), "the same letter is always cut the same way")
assert.notEqual(L.rtpJag(3), L.rtpJag(4))
assert.match(L.rtpJag(1), /^polygon\((-?[\d.]+% -?[\d.]+%, ){7}-?[\d.]+% -?[\d.]+%\)$/)

for (const n of [1, 2, 4, 7]) {
  const s = L.rtpBoard(n)
  assert.equal(s.length, 9)
  assert.deepEqual(s[4], { kind: "take", take: n - 1 }, "the final take sits in the centre (n=" + n + ")")
  for (const slot of s) if (slot.kind === "take") assert.ok(slot.take >= 0 && slot.take < n)
  for (let k = 0; k < n - 1; k++) assert.ok(s.some((x) => x.kind === "take" && x.take === k), "every take is pinned (n=" + n + ")")
  assert.equal(s.filter((x) => x.kind === "index").length, 1)
  assert.equal(s.filter((x) => x.kind === "count").length, 1)
}
const z = L.rtpZoom(1440, 900, 10)
assert.ok(z > 3 && z < 3.2, "the pull-back starts at about 3×")
assert.ok((1440 - 40) / 3 * z >= 1440 - 1e-6 && (900 - 40) / 3 * z >= 900 - 1e-6, "the centre cell covers the gate at the start")
assert.equal(L.rtpZoom(0, 0, 10), 3)

console.log("type-remix-preloader: ok")
