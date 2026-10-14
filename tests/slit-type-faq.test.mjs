// Checks for components/slit-type-faq.
// Run: node tests/slit-type-faq.test.mjs
//
// The search, deep-link, focus and contrast logic lives in the .tsx so the
// published component stays one file; the marked region is lifted out and run.
// The rest are the install-safety rules: no inherited height, CSS that cannot
// leak into the host page, a real accessible accordion, reduced motion.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(new URL("../components/slit-type-faq/slit-type-faq.tsx", import.meta.url), "utf8")

// #region logic
const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "logic region markers missing")
// Node 22.13+ strips TypeScript annotations natively; the region is plain functions.
const js = stripTypeScriptTypes(src.slice(start, end))
const m = await import("data:text/javascript," + encodeURIComponent(js))

// Ids: slugs of the question, accents dropped, duplicates numbered, own ids kept.
assert.equal(m.slugify("Can I import last month's rota?"), "can-i-import-last-month-s-rota")
assert.equal(m.slugify("Crème brûlée?"), "creme-brulee")
assert.equal(m.slugify("???"), "question")
assert.deepEqual(m.itemIds(["Why?", "Why?", "How?"], [undefined, undefined, "how"]), ["why", "why-2", "how"])

// Search: every word must match, in any order, any case.
assert.equal(m.matches("Which papers can you print on?", "PAPER print"), true)
assert.equal(m.matches("Which papers can you print on?", "paper laminate"), false)
assert.equal(m.matches("anything", "   "), true)
assert.deepEqual(m.highlightRuns("Paper and paper", "paper"), [
  { text: "Paper", hit: true },
  { text: " and ", hit: false },
  { text: "paper", hit: true },
])
assert.deepEqual(m.highlightRuns("abc", ""), [{ text: "abc", hit: false }])
assert.equal(
  m.highlightRuns("overlap", "over lap erl").map((r) => r.text).join(""),
  "overlap",
  "runs must rebuild the text exactly",
)

// Default open: index, id, list; single mode keeps one.
const ids = ["a", "b", "c"]
assert.deepEqual(m.resolveOpen(1, ids, true), ["b"])
assert.deepEqual(m.resolveOpen("c", ids, true), ["c"])
assert.deepEqual(m.resolveOpen([0, "c", 0], ids, false), ["a", "c"])
assert.deepEqual(m.resolveOpen([0, "c"], ids, true), ["a"])
assert.deepEqual(m.resolveOpen(["nope", 9], ids, false), [])
assert.deepEqual(m.resolveOpen(undefined, ids, false), [])
assert.deepEqual(m.resolveOpen("b", ["faq-a", "faq-b"], true, "faq-"), ["faq-b"], "unprefixed ids still resolve")

// Search snippets: an excerpt around the first match, trimmed at word boundaries.
const ans = "Uncoated stock from 90 to 300 gsm, in white, natural and about thirty colours. Soy ink never fully dries on coated or glossy paper, so we will not run it."
const snip = m.snippet(ans, "glossy")
assert.ok(snip.includes("glossy") && snip.startsWith("…") && snip.length < 150, snip)
assert.equal(m.snippet(ans, "laminate"), "")
assert.equal(m.snippet(ans, ""), "")
assert.ok(!m.snippet(ans, "uncoated").startsWith("…"), "a match at the start needs no leading ellipsis")

// Roving focus wraps; unknown keys are left alone.
assert.equal(m.nextFocus("ArrowDown", 2, 3), 0)
assert.equal(m.nextFocus("ArrowUp", 0, 3), 2)
assert.equal(m.nextFocus("Home", 2, 3), 0)
assert.equal(m.nextFocus("End", 0, 3), 2)
assert.equal(m.nextFocus("Tab", 0, 3), -1)
assert.equal(m.nextFocus("ArrowDown", 0, 0), -1)

// Text on the flood must read at 4.5:1 for every preset, light and dark.
const presets = [...src.matchAll(/(light|dark): \{ paper: "(#[0-9a-f]{6})", ink: "(#[0-9a-f]{6})", onInk: "(#[0-9a-f]{6})" \}/g)]
assert.equal(presets.length, 8, "four presets, light and dark")
for (const [, mode, paper, ink, onInk] of presets) {
  assert.ok(m.contrast(ink, onInk) >= 4.5, `${mode} ${ink}: answer text on the flood is ${m.contrast(ink, onInk).toFixed(2)}:1`)
  assert.ok(m.contrast(ink, paper) >= 4.5, `${mode} ${ink}: ink on paper is ${m.contrast(ink, paper).toFixed(2)}:1`)
}
assert.equal(m.pickOnInk("#1d3cf5", "#ffffff"), "#ffffff")
assert.equal(m.pickOnInk("#ffd400", "#fffbe6"), "#111111", "pale ink on pale paper falls back to near-black text")
assert.ok(Number.isNaN(m.contrast("red", "#fff")))
// #endregion

// A root that inherits its height renders here and collapses once installed.
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere")
assert.ok(/minHeight = 0,/.test(src), "minimum height defaults to a definite length (0: the section sizes to its questions)")
assert.doesNotMatch(src, /height:\s*\d+%/, "no percentage heights")

// 21st ships this file alone; the CSS must not reach the host page.
const cssStart = src.indexOf("const css = `") + 13
const css = src.slice(cssStart, src.indexOf("`", cssStart))
assert.ok(css.length > 4000, "css block not found")
assert.doesNotMatch(css, /@import/, "no @import")
assert.doesNotMatch(css, /\$\{/, "no template expressions in the CSS")
assert.doesNotMatch(css, /(^|\n)\s*(:root|body|html|\*)\s*[,{]/, "no bare global selectors")
// Every selector line (one ending in "{" or in "," inside a list) starts with the root class.
for (const line of css.split("\n")) {
  const t = line.trim()
  if (!t || t.startsWith("@") || t.startsWith("}") || /^(from|to|\d+%)\s*\{/.test(t)) continue
  if (!(t.endsWith("{") || t.endsWith(",") || /\{.*\}$/.test(t))) continue
  for (const part of t.split("{")[0].split(",")) {
    const sel = part.trim()
    if (sel) assert.ok(/^(\.stf|:where\(\.dark\) \.stf)/.test(sel), "unscoped selector: " + sel)
  }
}

// Reduced motion leaves a finished, still state.
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
for (const k of [".stf-ch", ".stf-ticker-track", ".stf-fill", ".stf-row--inv", ".stf-panel"]) assert.ok(reduced.includes(k), "reduced motion misses " + k)
assert.ok(/matchMedia\("\(prefers-reduced-motion: reduce\)"\)/.test(src), "JS must skip the wipe-out under reduced motion")

// A real accordion: buttons inside headings, expanded state, controlled regions.
assert.ok(/<h3 className="stf-h">\s*<button/.test(src), "question buttons sit inside headings")
assert.ok(src.includes("aria-expanded={isOpen}") && src.includes("aria-controls={panelId}"), "aria wiring")
assert.ok(src.includes('role="region"') && src.includes("aria-labelledby={btnId}"), "answer regions are labelled")
assert.ok(/stf-row--inv[^\n]*aria-hidden/.test(src), "the inverted copy is hidden from screen readers")
assert.ok(src.includes('aria-label={lines.join(" ")}'), "the split headline reads as one string")
assert.ok(/\.stf-item\[data-state="closed"\] \.stf-panel-in \{ visibility: hidden; \}/.test(css), "closed answers leave the tab order")

// The flood: ink and the inverted copy are clipped with the same box and timing.
const rule = (sel) => {
  const at = css.indexOf("\n" + sel + " {")
  assert.ok(at > -1, "rule missing: " + sel)
  return css.slice(at, css.indexOf("}", at))
}
const fill = rule(".stf-fill")
const inv = rule(".stf-row--inv")
for (const k of ["left: calc(var(--stf-gutter) * -1);", "right: calc(var(--stf-gutter) * -1);", "clip-path: inset(0 100% 0 0);"]) {
  assert.ok(fill.includes(k) && inv.includes(k), "flood and inverted row must share: " + k)
}

// The ink and the inverted copy must never disagree: every rule that moves one clip moves the other.
const clipRules = (sel) => [...css.matchAll(new RegExp("([^\\n{}]*)" + sel.replace(/[.[\]-]/g, "\\$&") + "\\s*\\{[^}]*clip-path:\\s*([^;]+);", "g"))].map((x) => x[1].trim() + " => " + x[2])
assert.deepEqual(clipRules(".stf-fill"), clipRules(".stf-row--inv"), "fill and inverted row clip in step")
assert.equal(clipRules(".stf-fill").length, 3, "closed, open and closing clips")

// The headline sits in its slit at rest, also under reduced motion.
assert.ok(/transform: translateY\(var\(--stf-cut\)\);\n  transition: transform/.test(css), "letters rest at the cut")
assert.ok(reduced.includes("translateY(var(--stf-cut))"), "reduced motion keeps the cut")
assert.ok(/slit = 0\.42,/.test(src), "sliced by default")

// 21st's parser: no TypeScript generics before the first JSX element closes.
const firstJsx = src.indexOf("</")
assert.doesNotMatch(src.slice(0, firstJsx), /\buse\w+</, "no hook generics before the first JSX close tag")
assert.doesNotMatch(src, /useState</, "no useState generics")

// No external assets, no web fonts.
assert.doesNotMatch(src, /https?:\/\/(?!www\.w3\.org)/, "no external URLs")

console.log("slit-type-faq: ok")
