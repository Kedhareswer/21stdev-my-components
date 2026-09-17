// Runnable check for the knitting charts in components/knitted-frame, plus the
// install-safety rules the .tsx has to keep.
// Run: node tests/knitted-frame.test.mjs
//
// The stitches are canvas and cannot be asserted here. The charts can, and they
// are where a quiet failure lives: an index that runs past the end of the
// colourway paints `undefined` as a stroke style, which silently draws black.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/knitted-frame/knitted-frame.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region knitting")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "knitting region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*\[number, number, number\] \| null/g, "")
  .replace(/:\s*\[number, number, number\]/g, "")
  .replace(/:\s*string\[\]/g, "")
  .replace(/:\s*KnitPattern/g, "")
  .replace(/:\s*number/g, "")
  .replace(/:\s*boolean/g, "")
  .replace(/:\s*string/g, "")
const { stitchNoise, stitchColorIndex, inBorder, parseHex, tintYarn } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

const PATTERNS = ["plain", "stripes", "ribbing", "seed", "chevron", "fairisle", "argyle"]

// ---- the wander is a hash, not a random number ----------------------------
{
  // It runs during the draw. If it were random, every repaint — a resize, a
  // re-render — would re-knit the border into a different fabric.
  for (let i = 0; i < 40; i++) {
    const v = stitchNoise(i, i * 3, 1)
    assert.ok(Number.isFinite(v) && v >= 0 && v < 1, `out of range at ${i}: ${v}`)
    assert.equal(stitchNoise(i, i * 3, 1), v, `not deterministic at ${i}`)
  }
  // Neighbours must not share a value, or the wander becomes a visible grid.
  const row = Array.from({ length: 20 }, (_, c) => stitchNoise(c, 4, 1))
  assert.ok(new Set(row).size >= 18, "neighbouring stitches wander together")
  // A different hand knits a different fabric.
  const a = Array.from({ length: 20 }, (_, c) => stitchNoise(c, 4, 1))
  const b = Array.from({ length: 20 }, (_, c) => stitchNoise(c, 4, 2))
  assert.ok(a.some((v, i) => v !== b[i]), "the seed changes nothing")
  // Negative coordinates appear at the edges of the grid.
  assert.ok(Number.isFinite(stitchNoise(-3, -7, 1)), "negative cells must still hash")
}

// ---- no chart may reach past the end of the colourway ---------------------
{
  // This is the one that actually breaks: argyle and fair isle want three
  // yarns. Handed two, an unclamped index returns undefined, which canvas
  // accepts as a strokeStyle and quietly draws in black.
  for (const pattern of PATTERNS) {
    for (let colors = 1; colors <= 5; colors++) {
      for (let col = -12; col <= 24; col++) {
        for (let row = -12; row <= 24; row++) {
          const i = stitchColorIndex(col, row, pattern, colors)
          assert.ok(
            Number.isInteger(i) && i >= 0 && i < colors,
            `${pattern} with ${colors} yarns gave ${i} at ${col},${row}`,
          )
        }
      }
    }
  }
  // A single yarn is plain knitting whatever the chart says.
  for (const pattern of PATTERNS) {
    assert.equal(stitchColorIndex(3, 5, pattern, 1), 0, `${pattern} must collapse to one yarn`)
  }
  assert.equal(stitchColorIndex(3, 5, "plain", 3), 0, "plain is always the ground")
}

// ---- each chart is actually the fabric it is named after ------------------
{
  // Ribbing runs in columns: constant down, alternating across.
  assert.equal(stitchColorIndex(2, 0, "ribbing", 2), stitchColorIndex(2, 9, "ribbing", 2))
  assert.notEqual(stitchColorIndex(2, 0, "ribbing", 2), stitchColorIndex(3, 0, "ribbing", 2))

  // Seed alternates in both directions, so no two neighbours ever match.
  for (let c = 0; c < 6; c++) {
    for (let r = 0; r < 6; r++) {
      assert.notEqual(
        stitchColorIndex(c, r, "seed", 2),
        stitchColorIndex(c + 1, r, "seed", 2),
        "seed must alternate across",
      )
      assert.notEqual(
        stitchColorIndex(c, r, "seed", 2),
        stitchColorIndex(c, r + 1, "seed", 2),
        "seed must alternate down",
      )
    }
  }

  // Stripes are bands of rows, constant across a row.
  assert.equal(stitchColorIndex(0, 4, "stripes", 2), stitchColorIndex(17, 4, "stripes", 2))
  assert.equal(stitchColorIndex(0, 3, "stripes", 2), stitchColorIndex(0, 5, "stripes", 2))
  assert.notEqual(stitchColorIndex(0, 2, "stripes", 2), stitchColorIndex(0, 3, "stripes", 2))

  // A chevron has to zigzag: the row at which the band changes must itself
  // move as you go across. Banding every single row instead reads as diagonal
  // stripes, which is what this was before.
  const flip = (col) => {
    for (let r = 0; r < 16; r++) {
      if (stitchColorIndex(col, r, "chevron", 2) !== stitchColorIndex(col, r + 1, "chevron", 2)) {
        return r
      }
    }
    return -1
  }
  const flips = [0, 1, 2, 3, 4].map(flip)
  assert.ok(flips.every((f) => f >= 0), "chevron must band at all")
  assert.ok(new Set(flips).size > 1, "the chevron band must move across the columns")

  // Fair isle and argyle reach for the third yarn when there is one.
  for (const pattern of ["fairisle", "argyle"]) {
    let used = false
    for (let c = 0; c < 20 && !used; c++) {
      for (let r = 0; r < 20; r++) {
        if (stitchColorIndex(c, r, pattern, 3) === 2) {
          used = true
          break
        }
      }
    }
    assert.ok(used, `${pattern} never uses its third yarn`)
  }
}

// ---- the border ring ------------------------------------------------------
{
  const cols = 20
  const rows = 14
  const band = 3
  // The middle is not knitted; that is where the content goes.
  assert.equal(inBorder(10, 7, cols, rows, band, 0), false, "the centre must stay open")
  // The four edges are.
  assert.equal(inBorder(0, 7, cols, rows, band, 0), true)
  assert.equal(inBorder(cols - 1, 7, cols, rows, band, 0), true)
  assert.equal(inBorder(10, 0, cols, rows, band, 0), true)
  assert.equal(inBorder(10, rows - 1, cols, rows, band, 0), true)
  // The band is exactly `band` stitches deep.
  assert.equal(inBorder(band - 1, 7, cols, rows, band, 0), true, "the inner edge of the band")
  assert.equal(inBorder(band, 7, cols, rows, band, 0), false, "and one stitch past it")
  // A rounded frame drops its outermost corner stitch.
  assert.equal(inBorder(0, 0, cols, rows, band, 3), false, "a rounded corner loses its corner")
  assert.equal(inBorder(0, 0, cols, rows, band, 0), true, "a square one keeps it")
  // A degenerate grid must not knit anything rather than throw.
  assert.equal(inBorder(0, 0, 0, 0, band, 0), false, "an empty grid has no border")
}

// ---- tinting --------------------------------------------------------------
{
  assert.deepEqual(parseHex("#4e8098"), [0x4e, 0x80, 0x98])
  assert.deepEqual(parseHex("4e8098"), [0x4e, 0x80, 0x98], "the hash is optional")
  assert.deepEqual(parseHex("#abc"), [0xaa, 0xbb, 0xcc], "three digits expand")
  assert.equal(parseHex("rebeccapurple"), null, "a named colour is not a hex")
  assert.equal(parseHex("#12345"), null, "nor is a five-digit one")

  // A colourway from one shade: three yarns, all of them related to the base.
  const way = tintYarn("#4e8098")
  assert.equal(way.length, 3, "a tint yields a ground and two contrasts")
  assert.equal(way[0], "#4e8098", "the base is the ground")
  assert.ok(way.every((c) => typeof c === "string" && c.length > 0), "every yarn is a colour")
  // The contrast has to be lighter than the ground, or the frame has no chart.
  const lum = (c) => {
    const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(c)
    const [r, g, b] = m ? [+m[1], +m[2], +m[3]] : parseHex(c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  assert.ok(lum(way[1]) > lum(way[0]) + 40, "the contrast must read as lighter")
  assert.ok(lum(way[2]) < lum(way[0]), "and the third as deeper")

  // A colour it cannot parse comes back as one plain yarn rather than a guess.
  assert.deepEqual(tintYarn("rebeccapurple"), ["rebeccapurple"], "unparseable stays single")
  // And a single-yarn colourway is legal everywhere a chart is used.
  for (const pattern of PATTERNS) {
    assert.equal(stitchColorIndex(4, 7, pattern, 1), 0, pattern + " must survive one yarn")
  }
}

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks — build CSS strings with concatenation")
// The fabric is drawn on every repaint, so it has to be reproducible.
assert.doesNotMatch(code, /Math\.random/, "the wander must be hashed, not random")

// The frame measures its own box; it wraps content of unknown size and can be
// anywhere on a page.
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("host.clientWidth"), "the frame measures its own box")
assert.ok(src.includes("new ResizeObserver"), "content that reflows must re-knit")

// The height is the content's. A percentage height on the root would collapse
// the whole frame wherever the host has no height chain.
// Only the root's own tag: the canvas inside is absolutely positioned in a
// relative parent, where h-full is exactly right.
const root = src.slice(src.indexOf("<div ref={hostRef}"), src.indexOf("<canvas"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")

// The padding is the border. Painting the panel on that box instead covers the
// canvas and hides every stitch but the corners.
assert.ok(
  /style=\{\{ padding: pad \}\}/.test(src),
  "the padded box must carry no background of its own",
)

// The renderer is a height field lit by its normals, not an offset dark copy.
// That is the whole reason the wool looks round, so it is worth pinning.
assert.ok(src.includes("getImageData"), "the frame must be lit per pixel")
assert.ok(/RIDGE_TONE/.test(src) && /RIDGE_WIDTH/.test(src), "the ridge needs its five passes")
assert.ok(/GAUGE\.relief/.test(src), "the normals must actually light it")

// The canvas is decoration and must never swallow a click meant for the
// content it is wrapped around.
assert.ok(src.includes("pointer-events-none"), "the canvas must not take the pointer")
assert.ok(src.includes('aria-hidden="true"'), "nor appear in the accessibility tree")

// Motion is optional here, so reduced motion simply arrives finished.
assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/L\.knitIn && !L\.reduced/.test(src), "reduced motion must skip the knit-on")
assert.ok(src.includes("cancelAnimationFrame(raf)"), "the loop must be cancelled")
assert.ok(src.includes("observer.disconnect()"), "and the observer disconnected")

// A demo wrapper left at width:auto collapses inside 21st's centring flex.
// Only the outermost element matters — flex rows *inside* the content are
// ordinary layout and have nothing to do with the trap.
const demo = readFileSync(
  new URL("../components/knitted-frame/demo.tsx", import.meta.url),
  "utf8",
)
const outer = demo.match(/className="([^"]*)"/)?.[1] ?? ""
assert.ok(
  /(^| )w-(full|screen|\[|\d)/.test(outer),
  "the demo's outermost wrapper needs a width: " + outer,
)

console.log("knitted-frame: ok")
