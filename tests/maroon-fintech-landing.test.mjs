// Install-safety and logic checks for components/maroon-fintech-landing.
// Run: node tests/maroon-fintech-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "maroon-fintech-landing"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const region = (name) => {
  const a = src.indexOf(`// #region ${name}\n`)
  const b = src.indexOf(`// #endregion ${name}\n`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a, b)
}

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|<link\b|<img\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no external URLs — device, circuit, satin and flags are drawn in the file")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: "max\(700px, calc\(" \+ height/, "the height prop reaches the hero")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
// height:100% only inside boxes that carry their own definite size
// (aspect-ratio device, fixed-height media, absolutely inset backdrops)
for (const m of src.matchAll(/([^{}]+)\{[^}]*\bheight:100%/g))
  assert.match(m[1].trim(), /^\.mfl-(device-btn|device-float|device-svg|satin|circuit|meter i)$/, `percentage height on ${m[1].trim()}`)
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "gradient, filter and clip references are built from the instance id")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback|Context)<|Record<|Array<|Promise<|Partial</, "no <generics> for the 21st CLI tokenizer to choke on")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (tilt, counters, word reveal)")

const css = src.match(/const MFL_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.mfl-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.mfl-svg\{display:block;max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.mfl-root :where\(button\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.mfl-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.doesNotMatch(css[1], /\.mfl-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav")
assert.match(css[1], /\.mfl-nav\{position:sticky/, "the nav sticks")
assert.match(css[1], /\.mfl-hero-foot\{pointer-events:none\}\n\.mfl-hero-foot>\*\{pointer-events:auto\}/, "the footer row never swallows clicks meant for the device")

/* ---------- it behaves like a landing page ---------- */

for (const k of ["about", "features", "contact"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /aria-expanded=\{menuOpen\}/, "the menu button is a disclosure")
assert.match(src, /role="listbox"/, "period, currency and range pickers are listboxes")
assert.match(src, /aria-activedescendant=/, "and announce their active option")
assert.match(src, /nextIndex\(active, e\.key, options\.length\)/, "arrow keys move through a picker")
assert.match(src, /if \(e\.key === "Escape"\) close\(\)/, "Escape closes a popover")
assert.match(src, /role="dialog" aria-modal="true"/, "request demo is a modal dialog")
assert.match(src, /isEmail\(form\.email\)/, "the demo form validates before sending")
assert.match(src, /alive\.current = true\n/, "the unmount guard survives strict mode's double mount")
assert.match(src, /aria-pressed=\{i === sel\}/, "wallet tiles are toggle buttons")
assert.match(src, /role="meter"/, "the budget bar is a meter")
assert.match(src, /below\.forEach\(\(n\) => n\.classList\.add\("mfl-pre"\)\)/, "only content below the fold is hidden for reveal")
assert.ok(read("demo.tsx").includes("<MaroonFintechLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-custom.tsx"), /palette="forest"/, "the custom demo reprints the page")
assert.doesNotMatch(read("demo-custom.tsx"), /="[^"]*\\n/, "no \\n inside a JSX string attribute (it would print literally)")

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic") +
  "\nexport { PALETTES, parseEmphasis, clamp, formatMoney, decimalsFor, formatCount, easeOutCubic, mulberry32, donutArcs, totalIn, spendingGrid, heatLevel, isEmail, nextIndex, statementTokens, resolvePalette }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

assert.deepEqual(L.parseEmphasis("Smarter *Financial*"), [{ text: "Smarter ", muted: false }, { text: "Financial", muted: true }])
assert.deepEqual(L.parseEmphasis("a *b"), [{ text: "a ", muted: false }, { text: "b", muted: true }], "an unclosed asterisk mutes the rest")
assert.deepEqual(L.parseEmphasis("plain"), [{ text: "plain", muted: false }])

assert.equal(L.formatMoney(263724.32, "$", 2), "$263,724.32")
assert.equal(L.formatMoney(678.23, "$ ", 2), "$ 678.23")
assert.equal(L.formatMoney(963164.98, "Rp ", 2), "Rp 963,164.98")
assert.equal(L.formatMoney(-1234.5, "€", 2), "-€1,234.50")
assert.equal(L.formatMoney(38253120, "₩", 0), "₩38,253,120")
assert.equal(L.formatMoney(999.996, "$", 2), "$1,000.00", "rounding carries into the thousands")
assert.equal(L.decimalsFor("JPY"), 0)
assert.equal(L.decimalsFor("EUR"), 2)
assert.equal(L.formatCount(500, 0), "500")
assert.equal(L.formatCount(3.5, 1), "3.5")

assert.equal(L.easeOutCubic(0), 0)
assert.equal(L.easeOutCubic(1), 1)
assert.equal(L.easeOutCubic(9), 1, "clamped")
assert.ok(L.easeOutCubic(0.5) > 0.5, "eases out")

const r1 = L.mulberry32(7), r2 = L.mulberry32(7)
assert.deepEqual([r1(), r1(), r1()], [r2(), r2(), r2()], "seeded, so server and client draw the same heatmap")

const arcs = L.donutArcs([1, 1, 2], 3)
assert.equal(arcs.length, 3)
assert.ok(Math.abs(arcs[2].start - (50 + 1.5)) < 1e-9, "arcs start where the previous share ends, plus half a gap")
assert.ok(Math.abs(arcs.reduce((a, x) => a + x.len, 0) - (100 - 9)) < 1e-9, "every arc gives up one gap")
assert.deepEqual(L.donutArcs([5], 3), [{ start: 0, len: 100 }], "a single category is a full ring, no gap")
assert.deepEqual(L.donutArcs([0, 0], 3), [{ start: 0, len: 0 }, { start: 0, len: 0 }], "nothing to draw")
assert.ok(L.donutArcs([1000, 1], 3)[1].len >= 0.6, "tiny shares stay visible")

const ws = [
  { code: "USD", symbol: "$", balance: 100, perUsd: 1 },
  { code: "EUR", symbol: "€", balance: 92, perUsd: 0.92 },
]
assert.ok(Math.abs(L.totalIn(ws, 1) - 200) < 1e-9, "wallets total in dollars")
assert.ok(Math.abs(L.totalIn(ws, 0.92) - 184) < 1e-9, "and in any wallet's currency")
assert.equal(L.totalIn([{ code: "X", symbol: "", balance: 5, perUsd: 0 }], 1), 0, "a missing rate never divides by zero")

const g = L.spendingGrid(7)
assert.equal(g.length, 12)
assert.ok(g.every((c) => c.length === 5 && c.every((v) => v > 0)))
assert.deepEqual(g, L.spendingGrid(7), "deterministic")
assert.notDeepEqual(g, L.spendingGrid(8))

assert.equal(L.heatLevel(0, 100), 0)
assert.equal(L.heatLevel(100, 100), 4, "the maximum is the loudest shade")
assert.equal(L.heatLevel(50, 100), 2)
assert.equal(L.heatLevel(5, 0), 0, "no max, no heat")

assert.ok(L.isEmail("ada@company.com"))
assert.ok(!L.isEmail("ada@company"))
assert.ok(!L.isEmail("ada company.com"))

assert.equal(L.nextIndex(0, "ArrowDown", 3), 1)
assert.equal(L.nextIndex(2, "ArrowDown", 3), 0, "wraps forward")
assert.equal(L.nextIndex(0, "ArrowUp", 3), 2, "wraps back")
assert.equal(L.nextIndex(1, "End", 3), 2)
assert.equal(L.nextIndex(1, "Home", 3), 0)
assert.equal(L.nextIndex(1, "x", 3), 1)

assert.deepEqual(L.statementTokens("Synais {mark} helps *you*"), ["Synais", "{mark}", "helps", "you"])
assert.deepEqual(L.statementTokens("a{mark}b"), ["a", "{mark}", "b"], "the mark splits glued words")

assert.equal(L.resolvePalette("forest").frame, L.PALETTES.forest.frame)
assert.equal(L.resolvePalette({ brand: "#123456" }).brand, "#123456", "a partial palette overrides")
assert.equal(L.resolvePalette({ brand: "#123456" }).night, L.PALETTES.maroon.night, "and falls back to maroon")
assert.equal(L.resolvePalette(undefined).frame, L.PALETTES.maroon.frame)
for (const [name, p] of Object.entries(L.PALETTES)) assert.equal(p.satin.length, 3, `${name} has a satin`)

console.log("maroon-fintech-landing: ok")
