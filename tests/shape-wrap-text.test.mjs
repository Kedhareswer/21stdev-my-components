// Runnable check for the line-breaking math in components/shape-wrap-text,
// plus the install-safety rules the .tsx has to keep.
// Run: node tests/shape-wrap-text.test.mjs
//
// The layout lives in the .tsx so the published component stays one file, so
// the marked region is lifted out and its type annotations stripped rather than
// keeping a second copy in sync. Widths come from a fake measurer (1px per
// character), which makes every expectation here exact arithmetic.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/shape-wrap-text/shape-wrap-text.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region flow")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "flow region markers missing")

const js = src
  .slice(start, end)
  .replace(
    /:\s*(Token\[\]|Measure|FlowOpts|Frag\[\]|ShapeKind|Shape|Run\[\]|number|string)(?=[,)\s={])/g,
    "",
  )
const { flowText, halfWidthAt, runsAround, fitShape } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

const measure = (s) => s.length // 1px per character
const words = (s) => s.split(" ").map((t, i) => ({ t, sp: i > 0 }))

// ---- no shape: plain greedy wrapping -------------------------------------
{
  const full = (top) => [[0, 10]]
  const frags = flowText(words("aaa bbb ccc ddd"), measure, {
    lineHeight: 10,
    maxLines: 50,
    justify: false,
    runsFor: full,
  })
  assert.equal(frags.length, 2, "10px of column fits two 3-char words per line")
  assert.equal(frags[0].text, "aaa bbb")
  assert.equal(frags[1].text, "ccc ddd")
  assert.equal(frags[1].y, 10, "second line sits one line-height down")
}

// ---- a run must never be overfilled --------------------------------------
{
  // 1px per character, so a 60px column is 60 characters wide.
  const shape = { x: 30, y: 34, radius: 13, kind: "circle", gutter: 3 }
  const text = "the quick brown fox jumps over the lazy dog and keeps running well past the edge of the column ".repeat(3).trim()
  const frags = flowText(words(text), measure, {
    lineHeight: 10,
    maxLines: 200,
    justify: false,
    runsFor: (top) => runsAround(60, top, 10, shape),
  })
  assert.ok(frags.length > 6, "expected a multi-line paragraph")

  for (const f of frags) {
    const runs = runsAround(60, f.y, 10, shape)
    const run = runs.find((r) => r[0] === f.x)
    assert.ok(run, `fragment at x=${f.x} does not start at a run edge`)
    assert.ok(
      measure(f.text) <= run[1] - run[0],
      `line at y=${f.y} overflows its run: ${measure(f.text)} > ${run[1] - run[0]}`,
    )
  }
}

// ---- text must never cross the shape -------------------------------------
{
  const shape = { x: 46, y: 40, radius: 18, kind: "circle", gutter: 4 }
  const frags = flowText(words("lorem ipsum dolor sit amet ".repeat(20).trim()), measure, {
    lineHeight: 8,
    maxLines: 200,
    justify: false,
    runsFor: (top) => runsAround(96, top, 8, shape),
  })
  assert.ok(frags.length > 10, "expected the shape to split several lines")

  for (const f of frags) {
    // Widest the shape gets anywhere inside this line's band.
    const dy = f.y > shape.y ? f.y - shape.y : f.y + 8 < shape.y ? shape.y - (f.y + 8) : 0
    const half = halfWidthAt(shape.kind, dy, shape.radius)
    if (half <= 0) continue
    const left = shape.x - half - shape.gutter
    const right = shape.x + half + shape.gutter
    const endsAt = f.x + measure(f.text)
    assert.ok(
      endsAt <= left + 1e-9 || f.x >= right - 1e-9,
      `line at y=${f.y} (${f.x}..${endsAt}) runs through the shape (${left}..${right})`,
    )
  }
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
  assert.equal(
    frags.map((f) => f.text).join(" "),
    source,
    "tokens must survive the round trip in order",
  )
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

// ---- a line the shape swallows entirely is skipped, not retried ----------
{
  // Shape wider than the column: the band it covers yields no runs at all.
  const shape = { x: 100, y: 30, radius: 200, kind: "diamond", gutter: 0 }
  const frags = flowText(words("alpha beta gamma delta epsilon"), measure, {
    lineHeight: 10,
    maxLines: 60,
    justify: false,
    runsFor: (top) => runsAround(200, top, 10, shape),
  })
  assert.ok(frags.length > 0, "text must resume below a fully covered band")
  assert.ok(frags.every((f) => f.y >= 0), "no negative line positions")
}

// ---- justify stretches every line but the last --------------------------
{
  const frags = flowText(words("aa bb cc dd ee ff"), measure, {
    lineHeight: 10,
    maxLines: 50,
    justify: true,
    runsFor: () => [[0, 9]],
  })
  assert.ok(frags.length >= 2, "expected more than one line")
  assert.ok(frags[0].wordSpacing > 0, "a full line should be stretched")
  assert.equal(frags[frags.length - 1].wordSpacing, 0, "the last line must stay ragged")
}

// ---- shape geometry ------------------------------------------------------
assert.equal(halfWidthAt("circle", 0, 10), 10, "circle is widest at its centre")
assert.equal(halfWidthAt("circle", 10, 10), 0, "circle closes at its radius")
assert.equal(halfWidthAt("diamond", 5, 10), 5, "diamond gives width back linearly")
assert.equal(halfWidthAt("circle", 99, 10), 0, "past the edge the column is clear")
assert.ok(
  halfWidthAt("squircle", 5, 10) > halfWidthAt("circle", 5, 10),
  "a squircle holds its width longer than a circle",
)
assert.deepEqual(
  runsAround(300, 0, 10, { x: 150, y: 500, radius: 50, kind: "circle", gutter: 10 }),
  [[0, 300]],
  "a line clear of the shape gets the whole column",
)

// ---- the shape gives way before the column becomes unreadable ------------
{
  // Roomy column: the shape keeps the size it was asked for.
  const wide = fitShape(720, 118, 16, 116)
  assert.equal(wide.radius, 118, "a wide column should not shrink the shape")
  assert.ok(wide.wraps)

  // Tight column: it shrinks so both runs still clear minRun.
  const tight = fitShape(460, 118, 16, 116)
  assert.ok(tight.wraps, "460px still has room to wrap")
  assert.ok(tight.radius < 118, "the shape must shrink to protect the runs")
  const leftover = (460 - 2 * 16 - 2 * tight.radius) / 2
  assert.ok(leftover >= 116 - 1e-9, `run left is ${leftover}, under minRun`)

  // Phone column: no radius leaves a readable run, so wrapping is abandoned.
  const phone = fitShape(327, 118, 16, 116)
  assert.equal(phone.wraps, false, "a 327px column must stop wrapping")
  assert.equal(phone.radius, 118, "stacked, the shape keeps its full size")
}

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /\bh-full\b/, "no percentage height — this component is content-sized")

// Measurement must never touch the DOM: that is the whole point, and it is what
// keeps a drag off the layout path.
assert.doesNotMatch(src, /getBoundingClientRect\(\)[\s\S]{0,80}(width|height)\s*\)/, "no DOM measurement for text")
assert.ok(src.includes("createElement(\"canvas\")"), "widths come from canvas measureText")
assert.ok(src.includes("document.fonts?.ready"), "a late webfont must trigger a re-layout")
assert.ok(src.includes("new ResizeObserver"), "a column resize must re-route the text")

// The visible fragments are absolutely positioned and unreadable in order, so
// the real text has to stay in the DOM for screen readers and selection.
assert.ok(src.includes("sr-only"), "the source text must remain available to assistive tech")
assert.ok(src.includes('aria-hidden="true"'), "decorative fragments must be hidden from the a11y tree")

console.log("shape-wrap-text: ok")
