// Runnable check for the typesetting in components/silhouette-wrap, plus the
// install-safety rules the .tsx has to keep.
// Run: node tests/silhouette-wrap.test.mjs
//
// The line breaker, the scanline profile and the responsive rule live in the
// .tsx so the published component stays one file, so the marked region is
// lifted out and its type annotations stripped rather than keeping a second
// copy in sync. Widths come from a fake measurer of 1px per character, which
// makes every expectation here exact arithmetic instead of a screenshot.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/silhouette-wrap/silhouette-wrap.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region flow")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "flow region markers missing")

const js = src
  .slice(start, end)
  .replace(
    /:\s*(Token\[\]|Measure|FlowOpts|Frag\[\]|Profile|Placement|Hit|Run\[\]|number|string)(?=[,)\s={])/g,
    "",
  )
const { flowText, sampleProfile, runsAround, fitSilhouette, withDropCap } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

const measure = (s) => s.length // 1px per character
const words = (s) => s.split(" ").map((t, i) => ({ t, sp: i > 0 }))

// A circle inscribed in the unit box, sampled the way a real path would be.
const circle = sampleProfile((x, y) => Math.hypot(x - 0.5, y - 0.5) <= 0.5, 64, 64)

// ---- no silhouette: plain greedy wrapping --------------------------------
{
  const frags = flowText(words("aaa bbb ccc ddd"), measure, {
    lineHeight: 10,
    maxLines: 50,
    justify: false,
    runsFor: () => [[0, 10]],
  })
  assert.equal(frags.length, 2, "10px of column fits two 3-char words per line")
  assert.equal(frags[0].text, "aaa bbb")
  assert.equal(frags[1].text, "ccc ddd")
  assert.equal(frags[1].y, 10, "the second line sits one line-height down")
}

// ---- the profile really is the outline -----------------------------------
{
  // Middle row of a circle spans nearly the full width, top row almost none.
  const mid = circle.rows >> 1
  assert.ok(circle.span[mid * 2] < 0.04, "the circle's waist should reach the left edge")
  assert.ok(circle.span[mid * 2 + 1] > 0.96, "and the right")

  const near = circle.span[2 * 2 + 1] - circle.span[2 * 2]
  const wide = circle.span[mid * 2 + 1] - circle.span[mid * 2]
  assert.ok(near < wide * 0.45, "a row near the top must be much narrower than the waist")

  // A shape that misses a row entirely reports -1, not a bogus zero-width span.
  const gap = sampleProfile((x, y) => y > 0.5, 8, 8)
  assert.equal(gap.span[0], -1, "an uncovered row is -1")
  assert.ok(gap.span[7 * 2] >= 0, "a covered row is not")
}

// ---- text must never cross the silhouette --------------------------------
{
  // 1px per character, so a 120px column is 120 characters wide.
  const at = { x: 26, y: 24, width: 64, height: 64, gutter: 4 }
  const frags = flowText(words("lorem ipsum dolor sit amet ".repeat(60).trim()), measure, {
    lineHeight: 8,
    maxLines: 300,
    justify: false,
    runsFor: (top) => runsAround(120, top, 8, circle, at),
  })
  assert.ok(frags.length > 20, "expected the outline to split many lines")

  let split = 0
  for (const f of frags) {
    const runs = runsAround(120, f.y, 8, circle, at)
    if (runs.length > 1) split++
    const run = runs.find((r) => r[0] === f.x)
    assert.ok(run, `fragment at x=${f.x}, y=${f.y} does not start at a run edge`)
    assert.ok(
      measure(f.text) <= run[1] - run[0],
      `line at y=${f.y} overflows its run: ${measure(f.text)} > ${run[1] - run[0]}`,
    )
  }
  assert.ok(split > 6, "the widest part of the outline should split lines in two")
}

// ---- the band is measured at its widest, not its midpoint ---------------
{
  // A line band straddling the circle's waist must be held off by the waist,
  // even though the band's top row is narrower.
  const at = { x: 0, y: 0, width: 100, height: 100, gutter: 0 }
  const straddling = runsAround(200, 44, 12, circle, at)
  const widest = runsAround(200, 49, 2, circle, at)
  assert.ok(
    straddling[0][1] <= widest[0][1] + 1e-9,
    "a tall band must clear the widest scanline it touches",
  )
}

// ---- every token is placed when there is room ----------------------------
{
  const source = "one two three four five six seven eight nine ten"
  const frags = flowText(words(source), measure, {
    lineHeight: 10,
    maxLines: 100,
    justify: false,
    runsFor: () => [[0, 40]],
  })
  assert.equal(frags.map((f) => f.text).join(" "), source, "tokens survive in order")
}

// ---- a token wider than the column terminates instead of spinning --------
{
  const frags = flowText(words("short " + "x".repeat(200) + " tail"), measure, {
    lineHeight: 10,
    maxLines: 20,
    justify: false,
    runsFor: () => [[0, 12]],
  })
  const joined = frags.map((f) => f.text).join(" ")
  assert.ok(joined.includes("x".repeat(200)), "the oversized token must still be placed")
  assert.ok(joined.includes("tail"), "layout must continue past an oversized token")
}

// ---- justify stretches every line but the last --------------------------
{
  const frags = flowText(words("aa bb cc dd ee ff"), measure, {
    lineHeight: 10,
    maxLines: 50,
    justify: true,
    runsFor: () => [[0, 9]],
  })
  assert.ok(frags[0].wordSpacing > 0, "a full line should be stretched")
  assert.equal(frags[frags.length - 1].wordSpacing, 0, "the last line must stay ragged")
}

// ---- the drop cap takes a notch out of the first lines only --------------
{
  const full = [[0, 100]]
  assert.deepEqual(withDropCap(full, 0, 3, 30), [[30, 100]], "line 0 is indented")
  assert.deepEqual(withDropCap(full, 2, 3, 30), [[30, 100]], "the last capped line too")
  assert.deepEqual(withDropCap(full, 3, 3, 30), full, "the line after it is not")
  assert.deepEqual(withDropCap(full, 0, 0, 30), full, "no cap, no notch")
  // A run entirely inside the cap disappears rather than going negative.
  assert.deepEqual(withDropCap([[0, 20]], 0, 3, 30), [], "a run swallowed by the cap is dropped")
}

// ---- the silhouette gives way before the column becomes unreadable -------
{
  const wide = fitSilhouette(720, 210, 18, 112)
  assert.equal(wide.width, 210, "a wide column should not shrink the silhouette")
  assert.ok(wide.wraps)

  const tight = fitSilhouette(460, 210, 18, 112)
  assert.ok(tight.wraps, "460px still has room to wrap")
  assert.ok(tight.width < 210, "the silhouette must shrink to protect the runs")
  assert.ok(
    (460 - 2 * 18 - tight.width) / 2 >= 112 - 1e-9,
    "both runs must still clear minRun",
  )

  const phone = fitSilhouette(327, 210, 18, 112)
  assert.equal(phone.wraps, false, "a 327px column must stop wrapping")
  assert.equal(phone.width, 210, "stacked, the silhouette keeps its full size")
}

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /\bh-full\b/, "no percentage height — this component is content-sized")

// Measuring, not reflowing, is the whole point: a scroll frame must not ask the
// DOM for text metrics.
assert.ok(src.includes('createElement("canvas")'), "widths come from canvas measureText")
assert.ok(src.includes("document.fonts?.ready"), "a late webfont must trigger a re-typeset")
assert.ok(src.includes("new ResizeObserver"), "a column resize must re-typeset")
assert.ok(src.includes("{ passive: true }"), "the scroll listener must not block scrolling")
assert.ok(src.includes("requestAnimationFrame"), "scroll reads must coalesce to one per frame")

// Path2D is not everywhere, and a missing one must degrade to the stacked
// layout rather than throwing during render.
assert.ok(src.includes('typeof Path2D === "undefined"'), "Path2D must be feature-detected")

// Motion is not optional: the fall is the animation, so reduced motion has to
// park it rather than merely slow it.
assert.ok(src.includes("usePrefersReducedMotion"), "must read prefers-reduced-motion")
assert.ok(/follow === "scroll" && !reduced/.test(src), "reduced motion must stop the fall")

// The typeset fragments are positioned spans; the prose has to stay readable.
assert.ok(src.includes("sr-only"), "the source text must remain available to assistive tech")
assert.ok(src.includes('aria-hidden="true"'), "decorative fragments must be hidden from the a11y tree")

console.log("silhouette-wrap: ok")
