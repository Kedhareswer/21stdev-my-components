// Checks for components/odometer-stage-stats.
// Run: node tests/odometer-stage-stats.test.mjs
//
// The figure parsing, scroll stepping and roll maths live in the .tsx so the
// published component stays one file; the marked region is lifted out and run
// (with the glyph table it reads). The rest are the install-safety rules: a root
// with a definite height, CSS that cannot leak into the host page, Preflight
// guards on the SVG numerals, reduced motion and a stoppable autoplay.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(new URL("../components/odometer-stage-stats/odometer-stage-stats.tsx", import.meta.url), "utf8")

// #region logic
const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion logic")
assert.ok(start > -1 && end > start, "logic region markers missing")
const six = src.match(/const BOWL_SIX = "[^"]+"/)[0]
const gStart = src.indexOf("const GLYPHS: { [k: string]: Glyph } = {")
assert.ok(gStart > -1, "glyph table not found")
const glyphs = src.slice(gStart, src.indexOf("\n}\n", gStart) + 2).replace(": { [k: string]: Glyph }", "")
const js = (six + "\n" + glyphs + "\n" + src.slice(start, end))
  .replace(": { [k: string]: string } =", " =")
  .replace(/\(stat: \{[^}]*\}\)/g, "(stat)")
  .replace(/\): (string\[\]|boolean|number|string) \{/g, ") {")
  .replace(/(\w+): (string\[\]|number|string)(?=[,)])/g, "$1")
  .replace("const out: string[] = []", "const out = []")
  .replace("const out: string[] = []", "const out = []")
const m = await import("data:text/javascript," + encodeURIComponent(js + "\nexport { GLYPHS }"))

// Figures: aliases map onto the drawn set, anything else is kept for the text fallback.
assert.deepEqual(m.parseValue("4.2x"), ["4", ".", "2", "×"])
assert.deepEqual(m.parseValue("12k"), ["1", "2", "K"])
assert.deepEqual(m.parseValue("$2.4B"), ["$", "2", ".", "4", "B"])
assert.deepEqual(m.parseValue("−3"), ["-", "3"])
assert.deepEqual(m.parseValue("9€"), ["9", "€"])
for (const ch of "0123456789.,%+×-/$KMB") assert.ok(m.isDrawn(ch), "glyph missing: " + ch)
assert.equal(m.isDrawn("€"), false)

// Width in ems of the cap height drives the fit-to-width size.
assert.equal(m.figureEm(["9", "6"]), 104 / 200 + 104 / 200 + m.GAP_EM)
assert.ok(m.figureEm(m.parseValue("$2.4B")) > m.figureEm(m.parseValue("96")))
assert.ok(m.figureEm([]) > 0, "an empty figure must not divide by zero")

// Scroll stepping: equal stretches, clamped at both ends.
assert.equal(m.stepFromProgress(0, 4), 0)
assert.equal(m.stepFromProgress(0.249, 4), 0)
assert.equal(m.stepFromProgress(0.25, 4), 1)
assert.equal(m.stepFromProgress(1, 4), 3)
assert.equal(m.stepFromProgress(-2, 4), 0)
assert.equal(m.stepFromProgress(3, 4), 3)
assert.equal(m.stepFromProgress(0.7, 1), 0)
assert.equal(m.progressWithin(0.375, 4), 0.5)
assert.equal(m.progressWithin(1, 4), 1)
// Jumping to a stat lands inside its own stretch, never on a boundary.
for (const n of [1, 2, 3, 4, 7]) for (let i = 0; i < n; i++) assert.equal(m.stepFromProgress(m.anchorFraction(i, n), n), i, `anchor ${i}/${n}`)

// The roll: digits spin through others and land on themselves; symbols just slide in.
for (let d = 0; d < 10; d++) {
  for (const pos of [0, 1, 2]) {
    const s = m.rollStrip(String(d), pos)
    assert.equal(s[s.length - 1], String(d))
    assert.ok(s.length >= 3, "a digit must spin")
    assert.ok(s.slice(0, -1).every((x) => x !== String(d)), "no spin digit repeats the target")
  }
}
assert.deepEqual(m.rollStrip("%", 0), ["%"])
assert.deepEqual(m.rollStrip(".", 3), ["."])

assert.equal(m.backdropWord({ label: "brands launched since 2014" }), "brands")
assert.equal(m.backdropWord({ label: "x", word: "" }), "", "an empty word turns the backdrop off")
assert.equal(m.backdropWord({ label: "“Teams” here" }), "Teams")
assert.equal(m.spoken({ value: "96", label: "brands" }), "96 brands")
assert.equal(m.pad2(4), "04")
assert.equal(m.wrap(-1, 4), 3)
assert.equal(m.wrap(2, 0), 0)

// Glyph paths are plain path data, and every glyph has a width.
for (const [k, g] of Object.entries(m.GLYPHS)) {
  assert.ok(g.w > 0, "glyph width: " + k)
  for (const d of [g.d, g.d2].filter(Boolean)) assert.match(d, /^[MLHVCQAZ0-9.\s-]+$/, "path data: " + k)
}
// #endregion

// A root that inherits its height renders here and collapses once installed.
assert.ok(src.includes('height = "100svh"'), "stage height must default to a definite length")
assert.ok(src.includes('step = "80svh"'), "scroll distance must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere")
assert.doesNotMatch(src, /height: ["']?100%/, "no percentage heights on the stage")

// 21st ships this file alone; the CSS must not reach the host page.
const css = src.slice(src.indexOf("const css = `") + 13, src.indexOf("`", src.indexOf("const css = `") + 13))
assert.ok(css.length > 2000, "css block not found")
const narrow = src.slice(src.indexOf("const narrowCss = `") + 19, src.indexOf("`", src.indexOf("const narrowCss = `") + 19))
assert.ok(narrow.length > 300, "narrow css block not found")
for (const block of [css, narrow]) {
  assert.doesNotMatch(block, /@import/, "no @import")
  assert.doesNotMatch(block, /\$\{/, "no template expressions in the CSS")
  for (const line of block.split("\n")) {
    if (!line.includes("{")) continue
    const sel = line.split("{")[0].trim()
    if (!sel || sel.startsWith("@") || sel.startsWith("}") || /^(from|to|\d+%)$/.test(sel)) continue
    for (const part of sel.split(",")) assert.ok(/^(\.dark )?\.ost/.test(part.trim()), "unscoped selector: " + part.trim())
  }
}
assert.ok(narrow.includes("@container (max-width: 760px)"), "the phone layout follows the component's own width")
assert.ok(css.includes("container-type: size"), "the stage is the size container")

// Tailwind Preflight's max-width must not squeeze the SVG numerals.
assert.ok(css.includes(".ost svg { max-width: none; }") && src.includes('maxWidth: "none"'), "numerals need a max-width escape")
assert.ok(/width=\{g\.w\}/.test(src) && /height=\{240\}/.test(src), "numerals need explicit dimensions")

// The cells clip at the cap height, so a spinning digit never spills over the label.
assert.ok(css.includes(".ost-cell { position: relative; display: block; flex: none; height: 1em; overflow: hidden; }"))

// Motion is not optional, and autoplay can be stopped.
assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "must honour prefers-reduced-motion")
assert.ok(src.includes('matchMedia("(prefers-reduced-motion: reduce)")'), "reduced motion also skips the roll in JS")
assert.ok(src.includes('"Pause stats"'), "autoplay needs a pause control")
assert.ok(src.includes('document.visibilityState === "hidden"'), "autoplay must stop in a hidden tab")

// Screen readers get each stat once, as text, not the rolling glyphs.
assert.ok(src.includes('aria-live="polite"'), "stat changes are announced")
assert.ok(src.includes('className="ost-figure"') && /className="ost-figure"[\s\S]{0,200}aria-hidden="true"/.test(src), "the drawn figure is hidden from screen readers")
assert.ok(src.includes("<dl className=\"ost-sr\">"), "every stat is in the DOM as text")

// No network: no web fonts, no remote images.
for (const url of src.match(/https?:\/\/[^"'\s)]+/g) || []) assert.ok(url.startsWith("http://www.w3.org/2000/svg"), "unexpected host: " + url)

// 21st's parser: no TypeScript generics before the first JSX close tag.
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "generic before first JSX")

console.log("odometer-stage-stats: ok")
