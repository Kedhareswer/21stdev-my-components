// Runnable check for the scroll math in components/crimson-confessional, plus
// the install-safety rules the .tsx has to keep.
// Run: node tests/crimson-confessional.test.mjs
//
// The canvas cannot be asserted here. What can — and what breaks silently — is
// the mapping from scroll position to chapter: an index that runs one past the
// end blanks the sequence at the very bottom of the scroll, and a progress
// measured from the wrong origin puts the whole piece out of step on any page
// that is not exactly the demo.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/crimson-confessional/crimson-confessional.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region scroll")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "scroll region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*\{ index: number; local: number \}/g, "")
  .replace(/:\s*number/g, "")
const { clamp01, smoothstep, progressFrom, chapterAt, typeOpacity } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// ---- progress is measured from the element -------------------------------
{
  const h = 5000
  const vp = 800
  // Top of the element level with the top of the viewport: nothing has moved.
  assert.equal(progressFrom(0, h, vp), 0, "at the top, progress is 0")
  // Scrolled far enough that the element's bottom meets the viewport's bottom.
  assert.equal(progressFrom(-(h - vp), h, vp), 1, "at the end, progress is 1")
  assert.ok(Math.abs(progressFrom(-(h - vp) / 2, h, vp) - 0.5) < 1e-9, "halfway is 0.5")
  // Above and below the element must clamp, not run negative or past one —
  // both put the canvas into a chapter that does not exist.
  assert.equal(progressFrom(500, h, vp), 0, "before it enters, progress clamps to 0")
  assert.equal(progressFrom(-99999, h, vp), 1, "past the end, progress clamps to 1")
  // An element shorter than the viewport has no travel and must not divide by
  // a negative — that silently reverses the whole sequence.
  assert.equal(progressFrom(-10, 400, vp), 0, "no travel means no progress")
  assert.equal(progressFrom(-10, vp, vp), 0, "exactly one viewport is still no travel")
}

// ---- the chapter index never leaves the array -----------------------------
{
  const n = 7
  for (let p = -0.5; p <= 1.5; p += 0.01) {
    const { index, local } = chapterAt(p, n)
    assert.ok(Number.isInteger(index) && index >= 0 && index < n, `index ${index} at p=${p}`)
    assert.ok(local >= 0 && local <= 1, `local ${local} at p=${p}`)
  }
  // The end of the scroll is the case that actually breaks: floor(1 * n) is n.
  assert.deepEqual(chapterAt(1, n), { index: n - 1, local: 1 }, "progress 1 stays on the last")
  assert.deepEqual(chapterAt(0, n), { index: 0, local: 0 }, "progress 0 is the first")
  // Chapter boundaries land where they should.
  assert.equal(chapterAt(1 / n + 1e-9, n).index, 1, "one nth in is the second chapter")
  assert.equal(chapterAt(1 / n - 1e-9, n).index, 0, "just before it is still the first")
  // An empty chapter list must not produce NaN and index into nothing.
  assert.deepEqual(chapterAt(0.5, 0), { index: 0, local: 0 }, "no chapters, no index")
}

// ---- the type fades in and out, and is never stuck on ---------------------
{
  assert.equal(typeOpacity(0), 0, "a chapter starts with its word absent")
  assert.equal(typeOpacity(1), 0, "and ends with it gone")
  assert.ok(typeOpacity(0.5) > 0.98, "and is fully present in the middle")
  let peak = 0
  for (let t = 0; t <= 1.0001; t += 0.005) {
    const v = typeOpacity(t)
    assert.ok(v >= -1e-9 && v <= 1 + 1e-9, `opacity left [0,1] at ${t}`)
    peak = Math.max(peak, v)
  }
  assert.ok(peak > 0.99, "the word must reach full strength somewhere")
}

// ---- smoothstep ------------------------------------------------------------
{
  assert.equal(smoothstep(0, 1, -1), 0)
  assert.equal(smoothstep(0, 1, 2), 1)
  assert.ok(Math.abs(smoothstep(0, 1, 0.5) - 0.5) < 1e-12)
  let prev = -1
  for (let x = 0; x <= 1.0001; x += 0.01) {
    const v = smoothstep(0.2, 0.8, x)
    assert.ok(v >= prev - 1e-12, `smoothstep went backwards at ${x}`)
    prev = v
  }
  // Equal edges would divide by zero and paint NaN across the canvas.
  assert.equal(smoothstep(0.5, 0.5, 0.4), 0, "equal edges must not divide by zero")
  assert.equal(smoothstep(0.5, 0.5, 0.6), 1)
  // NaN would reach the canvas as NaN geometry: nothing drawn, no error.
  assert.equal(clamp01(NaN), 0, "clamp must not pass NaN through")
  assert.equal(clamp01(-0), 0, "nor negative zero")
  assert.equal(clamp01(0.5), 0.5)
  assert.equal(clamp01(9), 1)
}

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks — build CSS strings with concatenation")

// Scroll position comes off the element. `window.scrollY` would be wrong the
// moment the component is not the only thing on the page.
assert.doesNotMatch(code, /scrollY|pageYOffset/, "measure from the element, not the document")
assert.ok(src.includes("getBoundingClientRect"), "progress comes from the element's rect")
assert.ok(src.includes("canvas.clientWidth"), "the canvas measures its own box")
assert.ok(src.includes("new ResizeObserver"), "a resized box must resize the drawing buffer")
assert.ok(/\{ passive: true \}/.test(src), "scroll listeners must be passive")

// The root's height is the timeline, so it has to be a definite length and must
// not be a percentage of an ancestor that may not have one.
assert.ok(/height: "calc\(" \+ chapters\.length \* chapterScroll/.test(src),
  "the root's height must be derived from the chapter count")
const root = src.slice(src.indexOf("<section"), src.indexOf("<canvas"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")
assert.ok(/sticky top-0 h-\[100svh\]/.test(src), "the stage is a sticky viewport-height child")

// The whole piece is motion. Reduced motion has to stop the loop, not slow it,
// and still advance by chapter so the copy remains reachable.
assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/if \(reduced\)/.test(src), "reduced motion must take its own path")
assert.ok(
  src.slice(src.indexOf("if (reduced)")).includes("removeEventListener(\"scroll\""),
  "the reduced-motion path must clean up its own listener",
)

// One rAF and one observer per mount; a route change that leaks them keeps
// painting a canvas that is no longer on the page.
for (const gone of ["cancelAnimationFrame(raf)", "observer.disconnect()"]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// The canvas is decoration; the words have to exist as text for anything that
// will never see it.
assert.ok(src.includes('aria-hidden="true"'), "the canvas must be hidden from the tree")
assert.ok(src.includes('className="sr-only"'), "the chapters must exist as real text")

// Every motif named in the type must actually be drawable, or a chapter using
// it renders nothing at all and looks like a dead scroll.
const declared = (src.match(/export type Motif =([^\n]+)/)?.[1] ?? "")
  .split("|")
  .map((s) => s.trim().replace(/"/g, ""))
  .filter(Boolean)
assert.equal(declared.length, 7, `expected 7 motifs, saw ${declared.length}`)
const table = src.slice(src.indexOf("> = { beam"), src.indexOf("> = { beam") + 200)
for (const m of declared) {
  assert.ok(table.includes(m + ":") || table.includes(m + ","), `motif ${m} has no draw function`)
}

// A demo wrapper left at width:auto collapses inside 21st's centring flex.
for (const cls of readFileSync(
  new URL("../components/crimson-confessional/demo.tsx", import.meta.url),
  "utf8",
).match(/className="[^"]*"/g) ?? []) {
  assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), `${cls} wraps the sequence without a width`)
}

console.log("crimson-confessional: ok")
