// Runnable check for components/receipt-work-ledger: filtering and sorting,
// the generated prints, the cursor chase, and the install-safety rules.
// Run: node tests/receipt-work-ledger.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) => readFileSync(new URL("../components/receipt-work-ledger/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("receipt-work-ledger.tsx")

const start = src.indexOf("// #region ledger")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "ledger region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- view: filter, sort -------------------------------------------------------
{
  const e = [
    { dept: "Brand", year: 2020 },
    { dept: "Pack", year: 2024 },
    { dept: "Brand", year: 2024 },
    { dept: "Type", year: "2022" },
  ]
  assert.deepEqual(L.ledgerView(e, "", "no"), [0, 1, 2, 3])
  assert.deepEqual(L.ledgerView(e, "Brand", "no"), [0, 2])
  assert.deepEqual(L.ledgerView(e, "", "year"), [1, 2, 3, 0], "newest first, ties keep list order, string years count")
  assert.deepEqual(L.ledgerView(e, "Web", "no"), [], "an empty department is empty, not everything")
  assert.deepEqual(L.departments(e), [
    { dept: "Brand", count: 2 },
    { dept: "Pack", count: 1 },
    { dept: "Type", count: 1 },
  ])
  assert.equal(L.yearSpan(e), "2020\u20132024")
  assert.equal(L.yearSpan([{ year: 2021 }]), "2021")
  assert.equal(L.yearSpan([]), "")
  assert.equal(L.yearSpan([{ year: "soon" }]), "", "non-numbers are ignored")
}

// ---- generated prints ---------------------------------------------------------
{
  const a = L.posterShapes("Oat & Ember identity")
  assert.deepEqual(a, L.posterShapes("Oat & Ember identity"), "same title, same print")
  assert.notDeepEqual(a, L.posterShapes("Norte Coffee cans"))
  for (const seed of ["a", "b", "Till Sans", "x".repeat(40), ""]) {
    const s = L.posterShapes(seed)
    assert.equal(s[0].kind, "rect", "a background first")
    assert.deepEqual([s[0].w, s[0].h], [L.POSTER_W, L.POSTER_H])
    assert.equal(s[s.length - 1].kind, "bars")
    assert.ok(s.length >= 5 && s.length <= 6)
    for (const sh of s) {
      assert.ok(sh.tone >= 0 && sh.tone <= 5, "tones are paper, four dithers or ink")
      for (const v of Object.values(sh).flat(2)) if (typeof v === "number") assert.ok(Number.isFinite(v))
    }
  }
  assert.equal(L.BAYER4.flat().sort((x, y) => x - y).join(), [...Array(16).keys()].join())
  for (const lv of L.DITHER_LEVELS) assert.equal(L.ditherCells(lv).length, lv)
}

// ---- follow ---------------------------------------------------------------------
{
  let cur = 0
  for (let i = 0; i < 300; i++) {
    const n = L.follow(cur, 100, 1 / 60, 0.09)
    assert.ok(n >= cur && n <= 100)
    cur = n
  }
  assert.equal(cur, 100, "settles exactly")
  assert.equal(L.follow(3, 50, 0.016, 0), 50, "no smoothing means 1:1")
}

// ---- font and barcode are the family's --------------------------------------------
assert.equal(L.pixelRuns("INDEX").cols, 5 * 6 - 1)
assert.deepEqual(L.barcodeBars("x", 160), L.barcodeBars("x", 160))
assert.equal(L.pad3(7), "007")

// ---- install safety -----------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"])
assert.doesNotMatch(src.replaceAll("http://www.w3.org/2000/svg", ""), /https?:\/\//)
assert.doesNotMatch(src, /@font-face|\.png|\.jpe?g|\.webp/)

const styleBlock = src.slice(src.indexOf("const styles = ["), src.indexOf('].join("\\n")'))
assert.ok(styleBlock.length > 500)
assert.doesNotMatch(styleBlock, /[`]|\$\{/)
assert.doesNotMatch(styleBlock, /@import/)
assert.ok(styleBlock.includes("prefers-reduced-motion"))
assert.ok(styleBlock.includes("@media (hover: none)"), "no cursor print on touch")
for (const [, rule] of styleBlock.matchAll(/^\s*"([^"\\]*(?:\\.[^"\\]*)*)",?$/gm)) {
  const sel = rule.split("{")[0].trim()
  if (!sel || sel.startsWith("@") || sel === "}" || !rule.includes("{")) continue
  for (const s of sel.split(",")) assert.ok(s.trim().startsWith(".rl-"), "selector escapes the component: " + s)
}

assert.ok(/height = "100svh"/.test(src))
assert.doesNotMatch(src, /\bh-(full|screen)\b/)
assert.ok(src.includes('maxWidth: "none"'))
assert.ok(src.includes("cancelAnimationFrame(raf.current)"))
assert.ok(src.includes('mq.removeEventListener("change"'))
assert.ok(src.includes('e.pointerType !== "mouse"'), "the print follows mice only")
assert.ok(src.includes("color: ink"), "dither patterns resolve currentColor against the ink, not the page")

assert.ok(src.includes('aria-pressed={dept === ""}'))
assert.ok(src.includes("aria-expanded={isOpen}"))
assert.ok(src.includes('role="region"'))
assert.ok(src.includes('aria-live="polite"'))

for (const f of ["demo.tsx", "demo-night.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/receipt-work-ledger"'))
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), f + ": " + cls)
}

console.log("receipt-work-ledger: ok")
