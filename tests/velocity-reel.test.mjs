// Runnable check for the scroll → shot mapping in components/velocity-reel,
// plus the install-safety rules the .tsx has to keep.
// Run: node tests/velocity-reel.test.mjs
//
// The canvas cannot be asserted from here. What can — and what breaks
// silently — is the timeline: an index that runs one past the end blanks the
// last shot, a crossfade that never reaches 1 leaves two shots stacked, and a
// colour parser that returns NaN paints nothing at all without an error.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/velocity-reel/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("velocity-reel.tsx")

const start = src.indexOf("// #region story")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "story region markers missing")
const E = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end)))
)

// ---- progress comes off the element and clamps ---------------------------
{
  const h = 9000
  const vp = 800
  assert.equal(E.progressFrom(0, h, vp), 0)
  assert.equal(E.progressFrom(-(h - vp), h, vp), 1)
  assert.equal(E.progressFrom(400, h, vp), 0, "before it enters")
  assert.equal(E.progressFrom(-1e6, h, vp), 1, "after it leaves")
  assert.equal(E.progressFrom(-10, 500, vp), 0, "no travel, no progress — never a negative divide")
}

// ---- the chapter index never leaves the list ------------------------------
{
  const n = 10
  for (let p = -0.5; p <= 1.5; p += 0.005) {
    const { index, local } = E.chapterAt(p, n)
    assert.ok(Number.isInteger(index) && index >= 0 && index < n, `index ${index} at ${p}`)
    assert.ok(local >= 0 && local <= 1, `local ${local} at ${p}`)
  }
  assert.deepEqual(E.chapterAt(1, n), { index: n - 1, local: 1 }, "the very bottom stays on the last shot")
  assert.deepEqual(E.chapterAt(0.5, 0), { index: 0, local: 0 }, "no chapters, no NaN")
}

// ---- crossfades land, and flashes only fire on flash cuts -----------------
{
  assert.equal(E.mixAt(0, 0.14), 0)
  assert.equal(E.mixAt(0.5, 0.14), 0, "mid-shot shows only this shot")
  assert.equal(E.mixAt(1, 0.14), 1, "the boundary is fully the next shot, so the cut is seamless")
  assert.equal(E.mixAt(1, 0), 0, "no window, no mix")
  assert.equal(E.flashAt(0.5, true, true), 0, "never mid-shot")
  assert.equal(E.flashAt(0, true, false), 1, "full at the head of a flash cut")
  assert.equal(E.flashAt(0, false, false), 0, "a fade never flashes")
  assert.equal(E.flashAt(1, false, true), 1, "full at the tail before a flash cut")
}

// ---- the title card -------------------------------------------------------
{
  assert.equal(E.titleReveal(0, true), 1, "the first title is up before anyone scrolls")
  assert.equal(E.titleReveal(0), 0)
  assert.equal(E.titleReveal(1), 0, "and gone before the cut")
  assert.equal(E.titleReveal(1, false, true), 1, "the last one stays — the reel rests on it")
  assert.ok(E.titleReveal(0.5) > 0.99)
}

// ---- timecode -------------------------------------------------------------
{
  assert.equal(E.timecode(0, 58), "00:00:00:00")
  assert.equal(E.timecode(1, 60), "00:01:00:00")
  assert.equal(E.timecode(0.5, 10), "00:00:05:00")
  assert.equal(E.timecode(2, 10), "00:00:10:00", "clamps")
  assert.match(E.timecode(0.123, 58), /^\d\d:\d\d:\d\d:\d\d$/)
}

// ---- colour and scale helpers never produce NaN ---------------------------
{
  assert.deepEqual(E.rgbOf("#ff1f3a"), [255, 31, 58])
  assert.deepEqual(E.rgbOf("#fff"), [255, 255, 255])
  assert.deepEqual(E.rgbOf("tomato"), [255, 255, 255], "non-hex falls back, never NaN")
  assert.equal(E.rgba("#000000", 2), "rgba(0,0,0,1.000)", "alpha clamps")
  assert.equal(E.shade("#808080", 0), "rgb(0,0,0)")
  assert.equal(E.shade("#808080", 2), "rgb(255,255,255)")
  assert.doesNotMatch(E.shade("#ff1f3a", 1.3), /NaN/)
  assert.equal(E.fitScale(0, 900), 0)
  assert.equal(E.fitScale(1600, 900), 1)
  // A phone crops the frame rather than shrinking the subject to nothing.
  assert.ok(E.fitScale(390, 844) > 390 / 1600, "portrait screens are not letterboxed down")
  for (let i = 0; i < 500; i++) {
    const v = E.hash(i)
    assert.ok(v >= 0 && v < 1)
  }
  assert.equal(E.hash(7), E.hash(7), "deterministic, so a scrub back lands on the same frame")
}

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const styleBlock = src.slice(src.indexOf("const styles = ["), src.indexOf('].join("\\n")'))
assert.ok(styleBlock.length > 20, "style block not found")
assert.doesNotMatch(styleBlock, /[`]|\$\{/, "no backticks or interpolation inside the CSS")
assert.doesNotMatch(styleBlock, /@import/, "no @import")
assert.doesNotMatch(styleBlock, /(^|["\n}])\s*(\*|body|html|:root)\s*\{/, "no bare global resets")
assert.ok(styleBlock.includes("prefers-reduced-motion"), "CSS motion must be opt-out")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /scrollY|pageYOffset/, "measure from the element, not the document")
assert.ok(src.includes("getBoundingClientRect"), "progress comes from the element's rect")
assert.ok(src.includes("new ResizeObserver"), "a resized box must resize the drawing buffer")
assert.ok(/\{ passive: true \}/.test(src), "scroll listeners must be passive")

// Height: the stage takes a definite length, the root's height is the timeline.
assert.ok(/height = "100svh"/.test(src), "stage height defaults to a definite length")
assert.ok(src.includes('"calc(" + Math.max(1, chapters.length * chapterScroll)'), "root height derives from chapter count")
const root = src.slice(src.indexOf("<section"), src.indexOf("<canvas"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root or stage")
assert.ok(src.includes('maxWidth: "none"'), "the canvas is guarded against Preflight's max-width")

// Reduced motion stops the loop and repaints on scroll instead.
assert.ok(src.includes("prefers-reduced-motion"))
const reducedPath = src.slice(src.indexOf("if (reduced) {\n      // No loop"))
assert.ok(reducedPath.includes("paint(0)"), "reduced motion paints a still")
assert.ok(reducedPath.slice(0, 600).includes('removeEventListener("scroll"'), "and cleans up its listener")
for (const gone of ["cancelAnimationFrame(raf)", "observer.disconnect()", 'stage.removeEventListener("pointermove"']) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// Every scene named in the type must have a shot, or that chapter is a black hole.
const declared = [...(src.match(/export type Scene =([\s\S]*?)\n\n/)?.[1] ?? "").matchAll(/"([a-z]+)"/g)].map((m) => m[1])
assert.equal(declared.length, 10, `expected 10 scenes, saw ${declared.length}`)
const table = src.slice(src.indexOf("const SCENES: Record<Scene"), src.indexOf("}", src.indexOf("const SCENES: Record<Scene")) + 300)
for (const s of declared) assert.ok(new RegExp("\\b" + s + "\\b").test(table), `scene ${s} has no draw function`)

// Accessibility: the canvas is decoration, the story exists as text, the rail is real buttons.
assert.ok(src.includes('aria-hidden="true"'))
assert.ok(src.includes('className="sr-only"'))
assert.ok(src.includes('type="button"') && src.includes("aria-label={\"Scene \""), "rail ticks are labelled buttons")

// Demo wrappers keep a width inside 21st's centring flex.
for (const f of ["demo.tsx", "demo-custom.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/velocity-reel"'), `${f} imports the installer path`)
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) {
    assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), `${f}: ${cls} has no width`)
  }
}

console.log("velocity-reel: ok")
