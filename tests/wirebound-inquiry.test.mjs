// Checks for components/wirebound-inquiry.
// Run: node tests/wirebound-inquiry.test.mjs
//
// The layout, validation and cover-fitting maths live in the .tsx so the
// published component stays one file; the marked region is lifted out, its
// types stripped with Node's own stripTypeScriptTypes, and run. The rest are
// the install-safety rules: a root with a definite height, CSS that cannot leak
// into the host page, Preflight guards, reduced motion, no generics the 21st
// CLI chokes on.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import * as nodeModule from "node:module"

const src = readFileSync(new URL("../components/wirebound-inquiry/wirebound-inquiry.tsx", import.meta.url), "utf8")

// #region logic
const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion logic")
assert.ok(start > -1 && end > start, "logic region markers missing")
assert.equal(typeof nodeModule.stripTypeScriptTypes, "function", "needs Node 22.13+ for stripTypeScriptTypes")
process.removeAllListeners("warning")
const js = nodeModule.stripTypeScriptTypes(src.slice(start, end))
const m = await import("data:text/javascript," + encodeURIComponent(js))

// Three arrangements: a spread beside the copy, a spread under it, one page on a phone.
assert.equal(m.layoutFor(1440).mode, "wide")
assert.equal(m.layoutFor(1024).mode, "stacked")
assert.equal(m.layoutFor(768).mode, "stacked")
assert.equal(m.layoutFor(375).mode, "single")
for (const w of [320, 375, 414, 768, 1024, 1280, 1440, 1920, 2560]) {
  const L = m.layoutFor(w)
  const book = L.mode === "single" ? L.gap + L.pageW + L.tab : L.tab * 2 + L.pageW * 2 + L.gap
  const room = L.mode === "wide" ? Math.min(w, 1560) - L.pad * 2 - L.textW - 40 : w - L.pad * 2
  assert.ok(book <= room, w + "px: the notebook must fit its column (" + book + " > " + room + ")")
  assert.ok(L.pageW >= 230, w + "px: page too narrow for the form (" + L.pageW + ")")
  assert.ok(L.pageH >= 450, w + "px: page too short for the details page")
  assert.ok(L.rule >= 26 && L.rule <= 31, "ruled lines stay readable")
}
assert.ok(m.layoutFor(0).pageW > 0, "a zero width (first paint, hidden tab) must not break the maths")

// Coil loops: evenly spaced, inside the page, enough of them to read as a binding.
const ys = m.ringYs(520)
assert.ok(ys.length >= 18)
assert.ok(ys[0] > 0 && ys[ys.length - 1] < 520)
assert.ok(ys.every((y, i) => i === 0 || y > ys[i - 1]))

assert.ok(m.isEmail("ada@northfold.co"))
assert.ok(m.isEmail("  ada.l+brief@studio.example.org "))
assert.ok(!m.isEmail("ada@northfold"))
assert.ok(!m.isEmail("ada northfold.co"))
assert.ok(!m.isEmail(""))

// Radios replace, checkboxes toggle, a second tap on a radio clears it.
assert.deepEqual(m.toggleOption([], "Website", false), ["Website"])
assert.deepEqual(m.toggleOption(["Website"], "Motion", false), ["Motion"])
assert.deepEqual(m.toggleOption(["Website"], "Website", false), [])
assert.deepEqual(m.toggleOption(["Website"], "Motion", true), ["Website", "Motion"])
assert.deepEqual(m.toggleOption(["Website", "Motion"], "Website", true), ["Motion"])

// Navigation stops at the first required question with no answer; optional ones never block.
const qs = [{ id: "a" }, { id: "b", optional: true }, { id: "c" }]
assert.equal(m.firstBlocked(qs, {}, 3), 0)
assert.equal(m.firstBlocked(qs, { a: ["x"] }, 3), 2)
assert.equal(m.firstBlocked(qs, { a: ["x"] }, 2), -1)
assert.equal(m.firstBlocked(qs, { a: ["x"], c: ["y"] }, 3), -1)
assert.equal(m.firstBlocked(qs, { a: [] }, 1), 0, "an emptied answer blocks again")

assert.deepEqual(m.detailsErrors("Ada", "ada@northfold.co", "", false), {})
assert.ok(m.detailsErrors(" ", "ada@northfold.co", "", false).name)
assert.ok(m.detailsErrors("Ada", "", "", false).email)
assert.ok(m.detailsErrors("Ada", "ada@", "", false).email)
assert.ok(m.detailsErrors("Ada", "ada@northfold.co", " ", true).message)

assert.equal(m.firstName("  Ada Lindqvist "), "Ada")
assert.equal(m.firstName(""), "")

// Cover lines: explicit breaks win, otherwise the most even two-line split.
assert.deepEqual(m.coverLines("MARLOWE & PIKE", 3), ["MARLOWE", "& PIKE"])
assert.deepEqual(m.coverLines("NORTH\nFOLD\nSTUDIO\nEXTRA", 3), ["NORTH", "FOLD", "STUDIO"])
assert.deepEqual(m.coverLines(["ODDFELLOW", "AUDIO"], 3), ["ODDFELLOW", "AUDIO"])
assert.deepEqual(m.coverLines("KILN", 3), ["KILN"])

// Fitting: condensed by default, squeezed to the cover, then shrunk rather than over-squeezed.
assert.deepEqual(m.fitLine(200, 400, 80), { scale: 0.74, size: 80 })
assert.equal(m.fitLine(800, 400, 80).scale, 0.5)
const tight = m.fitLine(2000, 400, 80)
assert.equal(tight.scale, 0.46)
assert.ok(tight.size < 80 && Math.abs(2000 * (tight.size / 80) * tight.scale - 400) < 1, "a long line still ends at the cover edge")
assert.deepEqual(m.fitLine(0, 400, 80), { scale: 0.74, size: 80 }, "unmeasured lines fall back to the condensed default")
// #endregion

// A root that inherits its height renders here and collapses once installed.
assert.ok(/height = "100svh"/.test(src), "section height must default to a definite length")
assert.ok(!/\bh-full\b/.test(src), "no h-full anywhere")
assert.ok(/minHeight: typeof height === "number"/.test(src), "height is applied as a definite min-height")

// CSS that cannot leak: no bare resets, no imports, no template holes.
const css = src.slice(src.indexOf("const CSS = `") + 13, src.indexOf("`", src.indexOf("const CSS = `") + 13))
assert.ok(css.length > 2000, "CSS block found")
assert.ok(!/@import/.test(css), "no @import")
assert.ok(!css.includes("${") && !css.includes("`"), "no template holes in the CSS")
for (const line of css.split("\n")) {
  const sel = line.trim()
  if (!sel.endsWith("{") || sel.startsWith("@") || /^\d|^from|^to/.test(sel)) continue
  for (const part of sel.slice(0, -1).split(",")) {
    assert.ok(/\.wbi/.test(part), "every selector is scoped to the component: " + part.trim())
  }
}
assert.ok(!/(^|[\s,}])(\*|body|html|:root)\s*\{/m.test(css), "no bare *, body, html or :root rules")
assert.ok(/\.wbi svg \{ max-width: none; \}/.test(css), "Preflight's max-width must not shrink the coil or title")
assert.ok(/:where\(\.wbi\) button/.test(css), "the button reset must stay low-specificity")

// Reduced motion: no page turns, no peeking cover, a finished still state.
assert.ok(/@media \(prefers-reduced-motion: reduce\)/.test(css))
assert.ok(/transition-duration: 0ms !important/.test(css))

// The 21st CLI hangs on generics before the first JSX close tag.
const headSrc = src.slice(0, src.indexOf("</"))
assert.equal(headSrc.match(/use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /g), null)

// A real form: labelled fields, live errors and announcements, real controls for the chips.
assert.ok(/role=\{q\.multiple \? "checkbox" : "radio"\}/.test(src))
assert.ok(/aria-live="polite"/.test(src))
assert.ok(/role="alert"/.test(src))
assert.ok(/htmlFor=\{uid \+ "-email"\}/.test(src))
assert.ok(/autoComplete="email"/.test(src))
// Pages that are not on top cannot be tabbed into.
assert.ok(/inert: ""/.test(src))

console.log("wirebound-inquiry: ok")
