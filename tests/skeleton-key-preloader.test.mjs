// Install-safety and timeline checks for skeleton-key-preloader.
// Run: node tests/skeleton-key-preloader.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/skeleton-key-preloader/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("skeleton-key-preloader.tsx")

// ---- install safety ----
assert.deepEqual(
  readdirSync(dir).sort(),
  ["README.md", "demo-gate.tsx", "demo-noir.tsx", "demo.tsx", "skeleton-key-preloader.tsx"],
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
assert.ok((src.match(/maxWidth: "none"|max-width: none/g) || []).length >= 6, "SVGs guard Preflight's max-width")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "no generic hook type arguments (the 21st CLI tokenizer hangs on them)")
assert.doesNotMatch(src.slice(0, src.lastIndexOf("</")), /\[K in /, "mapped types sit after the JSX")
assert.ok(src.includes('type="button"') && src.includes("onKeyDown={onGateKey}"), "the manual unlock is reachable without a pointer")

for (const f of ["demo.tsx", "demo-gate.tsx", "demo-noir.tsx"]) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]).filter((m) => m !== "react")
  assert.deepEqual(di, ["@/components/ui/skeleton-key-preloader"], f + ": imports only the component")
  assert.doesNotMatch(d, /https?:\/\//, f + ": no external assets")
}
assert.match(read("demo.tsx"), /<SkeletonKeyPreloader loop \/>/, "default demo is the bare looping component")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo does not wrap the full-bleed component")

// ---- scoped CSS ----
const css = src.match(/const SKP_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".skp-")), "unscoped selector: " + sel)
}
for (const k of css.matchAll(/@keyframes ([\w-]+)/g)) assert.ok(k[1].startsWith("skp-"), "unprefixed keyframes: " + k[1])

// ---- timeline ----
const a = src.indexOf("// #region timeline\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "timeline region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

assert.equal(L.skpSimulated(0), 0, "starts at 0")
assert.equal(L.skpSimulated(1), 100, "ends at exactly 100")
assert.equal(L.skpSimulated(-1), 0)
assert.equal(L.skpSimulated(3), 100)
let prev = -1
for (let i = 0; i <= 1000; i++) {
  const v = L.skpSimulated(i / 1000)
  assert.ok(v >= prev - 1e-9, "the simulated load never runs backwards (t=" + i / 1000 + ")")
  assert.ok(v >= 0 && v <= 100)
  prev = v
}

assert.equal(L.skpPad(0), "000")
assert.equal(L.skpPad(7.9), "007")
assert.equal(L.skpPad(100), "100")
assert.equal(L.skpPad(140), "100")

assert.equal(L.skpVersion(0, "1.0"), "0.0")
assert.equal(L.skpVersion(42, "1.0"), "0.4")
assert.equal(L.skpVersion(99.9, "1.0"), "0.9", "the count never shows the release early")
assert.equal(L.skpVersion(100, "2.0"), "2.0")

assert.deepEqual(L.skpSplit("portfolio"), { pixel: "P", sup: "o", mono: "rt", script: "folio" })
assert.deepEqual(L.skpSplit("archive"), { pixel: "A", sup: "r", mono: "ch", script: "ive" })
assert.deepEqual(L.skpSplit("my work"), { pixel: "M", sup: "y", mono: "wo", script: "rk" }, "spaces collapse")
assert.deepEqual(L.skpSplit("ok"), { pixel: "O", sup: "k", mono: "", script: "" }, "short words leave pieces empty")
assert.deepEqual(L.skpSplit(""), { pixel: "P", sup: "", mono: "", script: "" })

const P = L.skpGlyph("p")
assert.equal(P.length, 7, "seven rows")
for (const row of P) assert.match(row, /^[01]{6}$/, "six wide once emboldened")
assert.deepEqual(P, ["111110", "110011", "110011", "111110", "110000", "110000", "110000"])
const glyphs = new Set()
for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") {
  const g = L.skpGlyph(ch).join("")
  assert.notEqual(g, "1".repeat(42), ch + " has a real bitmap, not the fallback block")
  glyphs.add(g)
}
assert.equal(glyphs.size, 36, "every capital and digit has its own bitmap")
assert.equal(L.skpGlyph("§").join(""), "1".repeat(42), "unknown characters print as a block")

const px = L.skpPixels(P, 3, 40)
assert.equal(px.length, P.join("").split("1").length - 1, "one cell per lit pixel")
const ats = px.map((c) => c.at).sort((x, y) => x - y)
assert.equal(ats[0], 3, "the first pixel prints at the start of the window")
assert.equal(ats[ats.length - 1], 40, "the last pixel prints at the end of the window")
assert.deepEqual(L.skpPixels(P, 3, 40), px, "the print order is deterministic")
const firstRow = Math.max(...px.filter((c) => c.row === 0).map((c) => c.at))
const lastRow = Math.min(...px.filter((c) => c.row === 6).map((c) => c.at))
assert.ok(firstRow < lastRow, "it prints top to bottom")

const r1 = L.skpRand(9), r2 = L.skpRand(9)
for (let i = 0; i < 20; i++) {
  const v = r1()
  assert.equal(v, r2(), "the PRNG is deterministic")
  assert.ok(v >= 0 && v < 1)
}

assert.equal(L.skpFit(0, 0), 1, "an unmeasured gate falls back to 1")
assert.ok(Math.abs(L.skpFit(1440, 900) - 900 / 590) < 1e-9, "a wide gate fits by height")
assert.ok(Math.abs(L.skpFit(390, 844) - 390 / 820) < 1e-9, "a phone fits by width")
assert.equal(L.skpFit(10000, 10000), 1.7, "the board never blows up past 1.7")
assert.equal(L.skpFit(100, 100), 0.3)

for (const [w, h] of [[1440, 900], [390, 844], [2560, 1440]]) {
  const s = L.skpFit(w, h)
  const z = L.skpZoomMax(w, h, s, 11)
  assert.ok(11 * s * z >= Math.hypot(w, h) / 2, "the keyhole's round covers every corner at the end of the dive (" + w + "x" + h + ")")
}

const k = L.skpToKey(470, 506, 470, 506, 37, 1, 70, 392)
assert.ok(Math.abs(k.x - 70) < 1e-9 && Math.abs(k.y - 392) < 1e-9, "the tip maps to the tip")
const up = L.skpToKey(100, 0, 100, 100, 0, 2, 70, 392)
assert.ok(Math.abs(up.x - 70) < 1e-9 && Math.abs(up.y - 342) < 1e-9, "scale divides the offset")
const turned = L.skpToKey(110, 100, 100, 100, 90, 1, 0, 0)
assert.ok(Math.abs(turned.x) < 1e-9 && Math.abs(turned.y + 10) < 1e-9, "rotation is undone")

assert.equal(L.skpEase(0), 0)
assert.equal(L.skpEase(1), 1)
assert.equal(L.skpEase(0.5), 0.5)
assert.match(L.skpHole(0), /^M520 343 A11 11 0 0 1 [\d.]+ [\d.]+ L[\d.]+ 386 H[\d.]+ L[\d.]+ [\d.]+ A11 11 0 0 1 520 343 Z$/)
assert.notEqual(L.skpHole(1.2), L.skpHole(0), "the cap is larger than the hole")

console.log("skeleton-key-preloader: ok")
