// Runnable check for the deck math in components/gothic-stamp-deck, plus the
// install-safety rules the .tsx has to keep.
// Run: node tests/gothic-stamp-deck.test.mjs
//
// The drawings cannot be asserted here. What can is the layout that moves the
// same nine elements between the sheet and the deck, because everything the
// reader sees depends on it: get an offset wrong and a card flies across the
// deck in full view, get the grid wrong and a stamp hangs off the component.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(new URL("../components/gothic-stamp-deck/gothic-stamp-deck.tsx", import.meta.url), "utf8")

const start = src.indexOf("// #region deck")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "deck region markers missing")

const js = src.slice(start, end).replace(/:\s*(number|string)(?=[,)=\s])/g, "")
const {
  ASPECT, clamp01, wrapIndex, circularOffset, toRoman, tiltFromPointer,
  stampHoles, stampMask, mixHex, gridLayout, focusSize, focusSlot,
} = await import("data:text/javascript," + encodeURIComponent(js))

// ---- small pieces ---------------------------------------------------------
{
  assert.equal(clamp01(NaN), 0, "NaN must fall out as 0")
  assert.equal(clamp01(-2), 0)
  assert.equal(clamp01(3), 1)
  assert.equal(wrapIndex(-1, 9), 8, "the card before the first is the last")
  assert.equal(wrapIndex(9, 9), 0)
  assert.ok(Object.is(wrapIndex(0, 0), 0), "an empty deck must not produce NaN")

  const romans = { 1: "I", 4: "IV", 9: "IX", 12: "XII", 14: "XIV", 40: "XL", 147: "CXLVII", 1994: "MCMXCIV" }
  for (const [n, r] of Object.entries(romans)) assert.equal(toRoman(+n), r)
  assert.equal(toRoman(0), "0", "no numeral for zero — print the number")

  assert.equal(mixHex("#000000", "#ffffff", 0.5), "#808080")
  assert.equal(mixHex("#f00", "#00f", 0), "#ff0000", "three-digit hex expands")
  assert.equal(mixHex("#123456", "#abcdef", 1), "#abcdef")
}

// ---- the deck goes the short way round ------------------------------------
{
  const n = 9
  for (let active = 0; active < n; active++) {
    const offsets = Array.from({ length: n }, (_, i) => circularOffset(i, active, n))
    assert.equal(offsets[active], 0, "the focused card sits in the middle")
    // Every slot from -4..4 is used exactly once: no two cards share a place.
    assert.deepEqual([...offsets].sort((a, b) => a - b), [-4, -3, -2, -1, 0, 1, 2, 3, 4])
    assert.equal(offsets[wrapIndex(active + 1, n)], 1, "next is on the right")
    assert.equal(offsets[wrapIndex(active - 1, n)], -1, "previous is on the left, even across the wrap")
  }
  assert.ok(!Object.is(circularOffset(3, 3, 9), -0), "no negative zero reaches a transform")
}

// ---- only the neighbours are visible; the jump across the wrap is hidden ---
{
  const w = 1200, h = 800, bar = 110
  const fw = focusSize(w, h, bar)
  const mid = focusSlot(0, w, h, fw, bar)
  assert.equal(mid.x, w / 2)
  assert.equal(mid.scale, 1)
  assert.equal(mid.opacity, 1)
  const left = focusSlot(-1, w, h, fw, bar)
  const right = focusSlot(1, w, h, fw, bar)
  assert.ok(left.x < mid.x && right.x > mid.x, "neighbours either side")
  assert.ok(left.opacity > 0 && right.opacity > 0, "neighbours peek")
  assert.ok(left.scale < 1 && left.rot > 0 && right.rot < 0, "and turn in toward the centre")
  // The card that wraps from one end of the deck to the other travels the
  // whole width. It has to be invisible at both ends, or it streaks across.
  for (const d of [-4, -3, -2, 2, 3, 4]) assert.equal(focusSlot(d, w, h, fw, bar).opacity, 0, `offset ${d} must be hidden`)
  // The focused card fits above the bar.
  assert.ok(mid.y + (fw * ASPECT) / 2 <= h - bar + 30, "the focused card runs into the bar")
  assert.ok(fw * ASPECT <= h - bar, "the focused card is taller than the room")
  assert.ok(fw <= w * 0.68 + 1e-9, "the focused card leaves room for its neighbours")
}

// ---- the sheet fits inside the component ---------------------------------
{
  for (const [w, h] of [[1440, 900], [1100, 800], [768, 1024], [390, 760], [320, 568], [1920, 500]]) {
    for (const n of [1, 3, 6, 9, 12]) {
      const top = 120, gap = 16
      const g = gridLayout(n, w, h, top, gap)
      assert.equal(g.cells.length, n)
      assert.ok(g.cols * g.rows >= n, "every card has a cell")
      const cw = g.cardW, ch = g.cardW * ASPECT
      for (const c of g.cells) {
        assert.ok(c.x - cw / 2 >= -1e-6 && c.x + cw / 2 <= w + 1e-6, `card leaves the sides at ${w}x${h} n=${n}`)
        assert.ok(c.y - ch / 2 >= top - 1e-6 && c.y + ch / 2 <= h + 1e-6, `card leaves the box at ${w}x${h} n=${n}`)
      }
      // No two cards overlap.
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
          const a = g.cells[i], b = g.cells[j]
          assert.ok(Math.abs(a.x - b.x) >= cw - 1e-6 || Math.abs(a.y - b.y) >= ch - 1e-6, "cards overlap")
        }
    }
  }
  // A wide banner lays out in a row rather than a column of tiny stamps.
  assert.equal(gridLayout(6, 1920, 500, 100, 16).rows, 1)
}

// ---- tilt ---------------------------------------------------------------
{
  const mid = tiltFromPointer(0.5, 0.5, 14)
  assert.ok(Object.is(mid.rx, 0) && Object.is(mid.ry, 0), "the centre is flat, and not -0")
  assert.ok(tiltFromPointer(1, 0.5, 14).ry > 0, "pointer right turns the right edge away")
  assert.ok(tiltFromPointer(0.5, 0, 14).rx > 0, "pointer up tips the top back")
  for (const [x, y] of [[-3, 9], [9, -9], [NaN, 0.5]]) {
    const t = tiltFromPointer(x, y, 14)
    assert.ok(Math.abs(t.rx) <= 14 && Math.abs(t.ry) <= 14 && Number.isFinite(t.rx + t.ry), `tilt left its limit at ${x},${y}`)
  }
}

// ---- the perforation ------------------------------------------------------
{
  for (const [w, h, step] of [[300, 420, 20], [300, 420, 23], [311, 407, 17]]) {
    const holes = stampHoles(w, h, step)
    const keys = new Set(holes.map(([x, y]) => x.toFixed(3) + "," + y.toFixed(3)))
    assert.equal(keys.size, holes.length, "no hole is punched twice")
    for (const [x, y] of holes) assert.ok(x === 0 || y === 0 || Math.abs(x - w) < 1e-9 || Math.abs(y - h) < 1e-9, "holes sit on the edge")
    for (const corner of ["0.000,0.000", w.toFixed(3) + ",0.000", "0.000," + h.toFixed(3), w.toFixed(3) + "," + h.toFixed(3)])
      assert.ok(keys.has(corner), `every corner is punched (${corner})`)
    // Symmetric: the mirror of every hole is a hole.
    for (const [x, y] of holes) assert.ok(keys.has((w - x).toFixed(3) + "," + y.toFixed(3)), "the perforation is symmetric")
  }
  const mask = stampMask(300, 420, 20, 6.5)
  assert.ok(mask.startsWith('url("data:image/svg+xml,'), "the mask is a data URI")
  const body = mask.slice('url("data:image/svg+xml,'.length, -2)
  assert.doesNotMatch(body, /[<>#" ]/, "the SVG inside the mask is fully encoded")
  assert.ok(decodeURIComponent(body).includes("<mask id='m'>"), "and decodes back to the stamp")
}

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")

// The <style> string must not carry a template literal: 21st's pipeline
// mangles backticks and ${ inside CSS strings.
const style = src.slice(src.indexOf("const STYLE ="), src.indexOf("const useReducedMotion"))
assert.ok(style.length > 0, "STYLE block missing")
assert.doesNotMatch(style, /`|\$\{/, "no backticks or ${ in the CSS string")
assert.ok(/\.gsd-/.test(style) && !/(^|})\s*\.(?!gsd-)[a-z]/.test(style.replace(/@media[^{]*\{/, "")), "every rule is scoped under gsd-")

// Sized by the stage, never the window, and never by a percentage height.
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("new ResizeObserver"), "the stage must re-measure when its box changes")
assert.ok(src.includes("observer.disconnect()"), "and stop observing on unmount")
assert.ok(/height = "100svh"/.test(src), "the default height is a definite length")
const root = src.slice(src.indexOf("ref={stageRef}"), src.indexOf("onKeyDown={onKeyDown}"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")

// Preflight sets svg/img to display:block and max-width:100%; the faces size
// their SVG explicitly so it fills the card instead of shrinking to content.
assert.ok(/width="100%" height="100%" style=\{\{ display: "block" \}\}/.test(src), "face SVGs fill the card")

// Both sides, and a real flip.
assert.ok(src.includes("{/* Front */}") && src.includes("{/* Back */}"), "a card has a front and a back")
assert.ok((src.match(/backfaceVisibility: "hidden"/g) ?? []).length >= 2, "both faces hide their backface")
assert.ok(src.includes('transform: "rotateY(180deg)"'), "the back is mounted turned over")
assert.ok(src.includes('transformStyle: "preserve-3d"'), "the flip keeps its depth")
// A mask flattens 3D on the element it sits on, so it must be on the faces,
// never on the element doing the flip.
const flipper = src.slice(src.indexOf('isFlipped ? "rotateY(180deg)"') - 200, src.indexOf('isFlipped ? "rotateY(180deg)"'))
assert.doesNotMatch(flipper, /mask/i, "the flipping element must not carry the mask")

// Wheel on a native, non-passive listener, and only while a card is open —
// otherwise the page could not scroll past the sheet.
assert.ok(/addEventListener\("wheel", onWheel, \{ passive: false \}\)/.test(src), "wheel must be able to preventDefault")
assert.ok(/if \(activeRef\.current === null\) return\s+e\.preventDefault\(\)/.test(src), "the sheet must not swallow page scroll")
assert.ok(src.includes('removeEventListener("wheel", onWheel)'), "and let go of it")

// Keyboard: the deck is usable without a pointer.
for (const key of ['"ArrowRight"', '"ArrowLeft"', '"Escape"', '"Enter"']) assert.ok(src.includes(key), `missing ${key}`)
assert.ok(src.includes("aria-pressed"), "the open card reports whether it is turned")
assert.ok(src.includes('aria-live="polite"'), "the current card is announced")
assert.ok(src.includes("preventScroll: true"), "moving focus must not jump the page")

// Reduced motion stops the float and collapses the long transitions.
assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/isActive && !reduced \? " gsd-float"/.test(src), "no float under reduced motion")
assert.ok(/const dur = reduced \? 1 :/.test(src), "and no long travel")

// Every id inside a card's SVG is scoped to the instance, or two decks on one
// page (or two cards in one deck) fill each other's gold.
assert.ok(src.includes("React.useId()"), "ids come from useId")
assert.doesNotMatch(src, /\bid="(?!m')/, "no hard-coded SVG ids")

// A demo wrapper left at width:auto collapses inside 21st's centring flex.
for (const f of ["demo.tsx", "demo-custom.tsx"]) {
  const demo = readFileSync(new URL("../components/gothic-stamp-deck/" + f, import.meta.url), "utf8")
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) {
    assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), `${f}: ${cls} wraps the deck without a width`)
  }
}

console.log("gothic-stamp-deck: ok")
