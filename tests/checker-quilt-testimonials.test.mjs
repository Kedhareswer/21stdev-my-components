// Checks for components/checker-quilt-testimonials.
// Run: node tests/checker-quilt-testimonials.test.mjs
//
// The paging and checkerboard maths live in the .tsx so the published component
// stays one file; the marked region is lifted out and run. The rest are the
// install-safety rules: a root with a definite height, CSS that cannot leak
// into the host page, Preflight guards on the portraits, reduced motion.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/checker-quilt-testimonials/checker-quilt-testimonials.tsx", import.meta.url),
  "utf8",
)

// #region logic
const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion logic")
assert.ok(start > -1 && end > start, "logic region markers missing")
const js = src
  .slice(start, end)
  .replace(/\): ("start" \| "end"|"a" \| "b"|"l" \| "m" \| "s"|number\[\]|number|string) \{/g, ") {")
  .replace(/(\w+): (number|string)(?=[,)])/g, "$1")
  .replace("const out: number[] = []", "const out = []")
const m = await import("data:text/javascript," + encodeURIComponent(js))

assert.equal(m.wrap(-1, 3), 2)
assert.equal(m.wrap(3, 3), 0)
assert.equal(m.wrap(5, 0), 0, "empty list must not divide by zero")
assert.equal(m.pad2(3), "03")
assert.equal(m.pageCount(6, 2), 3)
assert.equal(m.pageCount(5, 2), 3)
assert.equal(m.pageCount(0, 2), 1)

// A short last page borrows from the start: no tile is ever empty.
assert.deepEqual(m.itemsOnPage(5, 2, 2), [4, 0])
assert.deepEqual(m.itemsOnPage(6, 1, 4), [4])
assert.deepEqual(m.itemsOnPage(0, 2, 0), [])

// The checkerboard: rows alternate sides, and every step inverts them.
assert.equal(m.fieldSide(0, 0), "start")
assert.equal(m.fieldSide(0, 1), "end")
assert.equal(m.fieldSide(1, 0), "end")
assert.equal(m.fieldSide(1, 1), "start")
for (let p = 0; p < 6; p++) for (const r of [0, 1]) assert.notEqual(m.fieldSide(p, r), m.fieldSide(p + 1, r), "a step must move each field")

// Two rows keep their colours (diagonal); one row alternates them per step.
assert.equal(m.fieldTone(3, 0, 2), "a")
assert.equal(m.fieldTone(3, 1, 2), "b")
assert.equal(m.fieldTone(0, 0, 1), "a")
assert.equal(m.fieldTone(1, 0, 1), "b")

// Switching between 2 rows and 1 keeps the first visible person on screen.
assert.equal(m.remapPage(2, 2, 1, 6), 4)
assert.equal(m.remapPage(5, 1, 2, 6), 2)
assert.equal(m.remapPage(4, 1, 2, 5), 2)

assert.equal(m.quoteSize("x".repeat(80)), "l")
assert.equal(m.quoteSize("x".repeat(160)), "m")
assert.equal(m.quoteSize("x".repeat(260)), "s")
assert.equal(m.initials("Graham Whitlock"), "GW")
assert.equal(m.initials("  cher "), "C")
assert.equal(m.initials("Mary Anne de la Cruz"), "MC")
// #endregion

// A root that inherits its height renders here and collapses once installed.
assert.ok(/height = "clamp\(560px, 84svh, 940px\)"/.test(src), "quilt height must default to a definite length")
assert.ok(/mobileHeight = "760px"/.test(src), "stacked height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere")

// 21st ships this file alone; the CSS must not reach the host page.
const css = src.slice(src.indexOf("const css = `") + 13, src.indexOf("`", src.indexOf("const css = `") + 13))
assert.ok(css.length > 1000, "css block not found")
assert.doesNotMatch(css, /@import/, "no @import")
assert.doesNotMatch(css, /\$\{/, "no template expressions in the CSS")
for (const line of css.split("\n")) {
  const sel = line.split("{")[0].trim()
  if (!sel || sel.startsWith("@") || sel.startsWith("}") || /^(from|to|\d+%)$/.test(sel)) continue
  for (const part of sel.split(",")) assert.ok(part.trim().startsWith(".cqt"), "unscoped selector: " + part.trim())
}

// Tailwind Preflight's img { max-width: 100% } must not shrink the portraits.
assert.ok(src.includes('maxWidth: "none"') && css.includes(".cqt img { max-width: none; }"), "portraits need a max-width escape")
assert.ok(/width=\{1200\}/.test(src) && /height=\{1200\}/.test(src), "portraits need explicit dimensions")

// Default portraits come from Unsplash only.
for (const url of src.match(/https:\/\/[^"'\s)]+/g) || []) {
  assert.ok(/^https:\/\/images\.unsplash\.com\//.test(url), "unexpected host: " + url)
}

// Motion is not optional, and autoplay can be stopped.
assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "must honour prefers-reduced-motion")
assert.ok(src.includes('"Pause testimonials"'), "autoplay needs a pause control")
assert.ok(src.includes('document.visibilityState === "hidden"'), "autoplay must stop in a hidden tab")

// 21st's parser: no TypeScript generics before the first JSX close tag.
const firstClose = src.indexOf("</")
assert.doesNotMatch(src.slice(0, firstClose), /\w<[A-Z][\w.]*(\[\])?>\(/, "generic call before first JSX")

console.log("checker-quilt-testimonials: ok")
