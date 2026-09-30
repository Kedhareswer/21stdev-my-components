// Runnable check for components/receipt-portfolio: the bitmap face, the dither
// tiles, the torn edge, the feed/tear numbers, and the install-safety rules.
// Run: node tests/receipt-portfolio.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) => readFileSync(new URL("../components/receipt-portfolio/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("receipt-portfolio.tsx")

const start = src.indexOf("// #region receipt")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "receipt region markers missing")
const R = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- the bitmap face ------------------------------------------------------
{
  for (const [ch, g] of Object.entries(R.PIXEL_FONT)) {
    assert.equal(g.length, 7, ch + " is 7 rows")
    const w = g[0].length
    assert.ok(g.every((row) => row.length === w && /^[.#]+$/.test(row)), ch + " rows are even and only . or #")
    if (ch !== " ") assert.ok(g.some((row) => row.includes("#")), ch + " has ink")
  }
  for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") assert.ok(R.PIXEL_FONT[c], "missing glyph " + c)

  const one = R.pixelRuns("I")
  assert.equal(one.cols, 5)
  const inked = one.runs.reduce((s, r) => s + r.w, 0)
  assert.equal(inked, R.PIXEL_FONT.I.join("").split("#").length - 1, "runs cover exactly the inked pixels")
  assert.equal(R.pixelRuns("PORTFOLIO").cols, 9 * 6 - 1, "5 wide plus 1 gap")
  assert.equal(R.pixelRuns("a b").cols, 5 + 1 + 3 + 1 + 5, "lowercase is upcased, space is 3 wide")
  assert.deepEqual(R.pixelRuns("~").runs, [], "unknown characters print as space")
  assert.equal(R.pixelRuns("").cols, 0)
  for (const r of R.pixelRuns("HELLO").runs) assert.ok(r.w > 0 && r.y >= 0 && r.y < 7)
}

// ---- dither ----------------------------------------------------------------
{
  const flat = R.BAYER4.flat().sort((a, b) => a - b)
  assert.deepEqual(flat, [...Array(16).keys()], "Bayer map is a permutation of 0..15")
  let prev = []
  for (const level of [0, ...R.DITHER_LEVELS, 16]) {
    const cells = R.ditherCells(level)
    assert.equal(cells.length, level, "level " + level + " inks " + level + " of 16")
    for (const c of prev) assert.ok(cells.some((d) => d[0] === c[0] && d[1] === c[1]), "darker tones keep the lighter tone's dots")
    prev = cells
  }
}

// ---- barcode, clip, numbers --------------------------------------------------
{
  const a = R.barcodeBars("RECEIPT1", 160)
  assert.deepEqual(a, R.barcodeBars("RECEIPT1", 160), "same text, same bars")
  assert.notDeepEqual(a, R.barcodeBars("RECEIPT2", 160), "reprints get new bars")
  for (let i = 0; i < a.length; i++) {
    assert.ok(a[i].x + a[i].w <= 160)
    if (i) assert.ok(a[i].x > a[i - 1].x + a[i - 1].w - 1e-9, "bars never touch")
  }
  const clip = R.zigzagClip(40, 7)
  assert.ok(clip.startsWith("polygon(0 0, 100% 0, 100% calc(100% - 7px)"))
  assert.ok(clip.endsWith("0% calc(100% - 7px))"))
  assert.equal(clip.split(",").length, 2 + 41)
  assert.equal(R.pad3(1), "001")
  assert.equal(R.pad3(1234), "1234")
  assert.equal(R.pad3(-3), "000")
  assert.equal(R.formatDate(new Date(2026, 6, 4)), "04.07.2026")
  assert.equal(R.feedSeconds(0), 1.4)
  assert.equal(R.feedSeconds(1e5), 3.2)
  assert.ok(R.feedSeconds(1200) > R.feedSeconds(800), "longer receipts print longer")
  assert.equal(R.rubber(0, 34), 0)
  assert.equal(R.rubber(-50, 34), 0, "pushing up does nothing")
  let last = 0
  for (let d = 1; d < 2000; d += 7) {
    const v = R.rubber(d, 34)
    assert.ok(v > last && v < 34, "pull gives more and more, never past the limit")
    last = v
  }
  assert.ok(R.TEAR_AT > 40 && R.TEAR_AT < 200)
}

// ---- install safety ----------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src.replaceAll("http://www.w3.org/2000/svg", ""), /https?:\/\//, "no external origins")
assert.doesNotMatch(src, /@font-face|\.png|\.jpe?g|\.webp/, "drawn, not shipped")

const styleBlock = src.slice(src.indexOf("const styles = ["), src.indexOf('].join("\\n")'))
assert.ok(styleBlock.length > 500, "style block not found")
assert.doesNotMatch(styleBlock, /[`]|\$\{/, "no backticks or interpolation inside the CSS")
assert.doesNotMatch(styleBlock, /@import/)
assert.ok(styleBlock.includes("prefers-reduced-motion"), "CSS motion must be opt-out")
for (const [, rule] of styleBlock.matchAll(/^\s*"([^"\\]*(?:\\.[^"\\]*)*)",?$/gm)) {
  const sel = rule.split("{")[0].trim()
  if (!sel || sel.startsWith("@") || sel.startsWith("from") || sel.startsWith("to") || sel === "}" || !rule.includes("{")) continue
  for (const s of sel.split(",")) assert.ok(s.trim().startsWith(".rp-"), "selector escapes the component: " + s)
}

assert.ok(/height = "100svh"/.test(src), "wall height defaults to a definite length")
assert.doesNotMatch(src, /\bh-(full|screen)\b/, "no percentage-height classes")
assert.ok(src.includes("minHeight: height"))
assert.ok(src.includes('maxWidth: "none"'), "svgs and images are guarded against Preflight")
assert.ok(src.includes("container-type: inline-size"), "type scales with the receipt")
assert.ok(/\.rp-paper \{[^"]*container-type/.test(src), "the container is outside the padded receipt, so padding in cqi resolves")

// Behaviour.
assert.ok(src.includes("IntersectionObserver"), "prints when it scrolls into view")
assert.ok(src.includes("io.disconnect()"))
assert.ok(src.includes('mq.removeEventListener("change"'))
assert.ok(src.includes("window.clearTimeout(timer.current)"))
assert.ok(src.includes("if (reduced) {") && src.includes('setPhase("ready")'), "reduced motion skips the feed")
assert.ok(src.includes("setPointerCapture"), "the tear drag keeps the pointer")
assert.ok(src.includes("e.detail === 0"), "keyboard can tear too")
assert.ok(src.includes("if (!date) setToday(formatDate(new Date()))"), "the date is set after mount, never during render")

// Accessibility.
assert.ok(src.includes('type="button"'))
assert.ok(src.includes("aria-expanded={has ? isOpen : undefined}"))
assert.ok(src.includes('role="region"'))
assert.ok(src.includes('aria-live="polite"'))
assert.ok(src.includes("visibility: hidden"), "closed sections leave the tab order")

// Default copy follows the reference: six items, 001..006.
const items = src.slice(src.indexOf("const DEFAULT_ITEMS"), src.indexOf("const styles"))
assert.deepEqual([...items.matchAll(/^    label: "([^"]+)"/gm)].map((m) => m[1]), ["About me", "Logofolio", "Branding", "Packaging", "Font", "Contacts"])
assert.ok(src.includes('title = "Portfolio"') && src.includes('totalValue = "1 designer"'))

for (const f of ["demo.tsx", "demo-night.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/receipt-portfolio"'), f + " imports the installer path")
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), f + ": " + cls + " has no width")
}

console.log("receipt-portfolio: ok")
