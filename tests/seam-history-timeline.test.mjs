// Checks for components/seam-history-timeline.
// Run: node tests/seam-history-timeline.test.mjs
//
// The year parsing, snapping, seam geometry and contrast logic lives in the
// .tsx so the published component stays one file; the marked region is lifted
// out and run. The rest are the install-safety rules: no inherited height, CSS
// that cannot leak into the host page, Preflight guards, keyboard and screen
// reader support, reduced motion.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(new URL("../components/seam-history-timeline/seam-history-timeline.tsx", import.meta.url), "utf8")

// #region logic
const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "logic region markers missing")
const js = stripTypeScriptTypes(src.slice(start, end))
const m = await import("data:text/javascript," + encodeURIComponent(js))

// Years: numbers, pairs, ranges written any common way, and words.
assert.deepEqual(m.normalizeYears(2019), ["2019"])
assert.deepEqual(m.normalizeYears([2021, 2022]), ["2021", "2022"])
assert.deepEqual(m.normalizeYears([2021, 2022, 2023]), ["2021", "2022"], "at most two pills")
assert.deepEqual(m.normalizeYears("2021-2022"), ["2021", "2022"])
assert.deepEqual(m.normalizeYears("2021 – 2022"), ["2021", "2022"])
assert.deepEqual(m.normalizeYears("2021 to 2022"), ["2021", "2022"])
assert.deepEqual(m.normalizeYears("Today"), ["Today"])
assert.deepEqual(m.normalizeYears("Spring 2024"), ["Spring 2024"], "a phrase with one year stays one pill")
assert.equal(m.spokenYears(["2021", "2022"]), "2021 to 2022")
assert.equal(m.spokenYears(["2019"]), "2019")

// Index and focus.
assert.equal(m.clampIndex(-3, 5), 0)
assert.equal(m.clampIndex(9, 5), 4)
assert.equal(m.clampIndex(2.6, 5), 3)
assert.equal(m.clampIndex(1, 0), 0)
assert.equal(m.focusAt(2, 2), 1)
assert.equal(m.focusAt(2.5, 2), 0.5)
assert.equal(m.focusAt(0, 3), 0)

// Travel: one step per milestone, stopping with the last card flush, rubber band past the end.
assert.equal(m.trackShift(2, 700, 5000, 6), 1400)
assert.equal(m.trackShift(5, 700, 3000, 6), 3000, "stops at maxShift")
assert.equal(m.trackShift(5.2, 700, 3000, 6), 3140, "keeps following past the last milestone")
assert.equal(m.trackShift(-0.1, 700, 3000, 6), -70, "rubber band before the first")
assert.equal(m.trackShift(3, 700, 0, 6), 0, "a strip that fits never moves")


// Passed cards: fully there at the edge, gone once well past it.
assert.equal(m.passedOpacity(0, 700), 1)
assert.equal(m.passedOpacity(-100, 700), 1)
assert.equal(m.passedOpacity(-700, 700), 0)
assert.ok(m.passedOpacity(-300, 700) > 0 && m.passedOpacity(-300, 700) < 1)

// Rubber band: grows, but never past its limit.
assert.equal(m.rubber(0, 0.35), 0)
assert.ok(m.rubber(0.2, 0.35) < 0.2)
assert.ok(m.rubber(100, 0.35) < 0.35)

// Snapping: nearest milestone, thrown along by velocity, a flick always moves one.
assert.equal(m.snapIndex(1.3, 0, 700, 1, 6), 1)
assert.equal(m.snapIndex(1.6, 0, 700, 1, 6), 2)
assert.equal(m.snapIndex(1.1, -2, 700, 1, 6), 2, "a fast drag to the left moves forward")
assert.equal(m.snapIndex(1.05, -0.5, 700, 1, 6), 2, "a short flick still moves one")
assert.equal(m.snapIndex(0.95, 0.5, 700, 1, 6), 0)
assert.equal(m.snapIndex(5.2, -3, 700, 5, 6), 5, "never past the last milestone")
assert.equal(m.snapIndex(0, 3, 700, 0, 6), 0, "never before the first")

// Liquid neck: thick when the ends are close, thinning as they stretch, never gone.
assert.ok(m.neckRatio(0) > m.neckRatio(300))
assert.ok(m.neckRatio(5000) >= 0.16)
assert.ok(m.neckRatio(0) <= 0.46)

// Seam geometry: a closed path, parallel seams, straight outer edges.
const p = m.seamPath(800, 500, 100, 18, true, true)
assert.match(p, /^M[\d. ]+Q[\d. ]+(L[\d. ]+Q[\d. ]+){3}Z$/)
const nums = (s) => s.match(/-?\d+(\.\d+)?/g).map(Number)
const first = m.seamPath(800, 500, 100, 18, false, true)
assert.deepEqual(nums(first).slice(0, 6), [0, 18, 0, 0, 18, 0], "first card: square top-left corner, rounded by r")
const mid = nums(p)
assert.equal(mid[2], 100, "slanted top-left corner sits o px in")
assert.ok(m.seamPath(800, 500, 100, 0, true, true, 0).startsWith("M0 0Q0 0"), "a left lean of 0 straightens the left edge")
assert.ok(m.seamPath(800, 500, 100, 0, true, true, 40).includes("Q40 0"), "the left edge can lean less than the right")
const last = m.seamPath(800, 500, 100, 0, true, false)
assert.ok(last.includes("Q800 500"), "last card: straight right edge")
assert.ok(m.seamPath(800, 500, 100, 0, true, true).includes("Q700 500"), "right seam leans in by o at the bottom")
assert.ok(!/NaN/.test(m.seamPath(0, 0, 0, 18, true, true)), "degenerate size stays a valid path")

// Contrast: every preset, light and dark, reads.
const presetCount = Object.keys(m.PRESETS).length
assert.equal(presetCount, 4)
for (const [name, modes] of Object.entries(m.PRESETS)) {
  for (const [mode, c] of Object.entries(modes)) {
    const tag = `${name}/${mode}`
    assert.ok(m.contrast(c.onField, c.field) >= 4.5, `${tag}: heading and rail years on field ${m.contrast(c.onField, c.field).toFixed(2)}`)
    assert.ok(m.contrast(c.mutedOnField, c.field) >= 4.5, `${tag}: intro on field ${m.contrast(c.mutedOnField, c.field).toFixed(2)}`)
    assert.ok(m.contrast(c.ink, c.card) >= 7, `${tag}: title on card ${m.contrast(c.ink, c.card).toFixed(2)}`)
    assert.ok(m.contrast(c.muted, c.card) >= 4.5, `${tag}: body on card ${m.contrast(c.muted, c.card).toFixed(2)}`)
    assert.ok(m.contrast(c.onPill, c.pill) >= 7, `${tag}: years on pill ${m.contrast(c.onPill, c.pill).toFixed(2)}`)
  }
}
assert.ok(Number.isNaN(m.contrast("red", "#fff")))
// #endregion

// Install safety: no inherited height, scoped CSS, Preflight guard.
assert.ok(!/\bh-full\b/.test(src), "no h-full anywhere")
const css = src.slice(src.indexOf("const STYLES = `") + 16, src.indexOf("`", src.indexOf("const STYLES = `") + 16))
assert.ok(css.length > 1000, "styles found")
assert.ok(!css.includes("${") && !css.includes("@import"), "no interpolation or @import in the CSS")
for (const rule of css.split("}")) {
  const sel = rule.split("{")[0].trim()
  if (!sel || sel.startsWith("@") || /^(from|to|\d+%)$/.test(sel)) continue
  for (const part of sel.split(",")) {
    const s = part.trim()
    if (!s) continue
    assert.ok(/\.sht/.test(s), "every selector is scoped to .sht: " + s)
  }
}
assert.ok(/\.sht__photo img\{[^}]*max-width:none/.test(css), "Preflight img max-width guard")
assert.ok(/objectPosition: m\.imagePosition/.test(src), "imagePosition reaches the photo")
assert.ok(/failed\[m\.image\]/.test(src), "image failures are keyed by URL")
assert.ok(/width=\{geo\.cw/.test(src) && /height=\{geo\.ph/.test(src), "images carry explicit width and height")
assert.ok(/draggable=\{false\}/.test(src), "images are not native-draggable")

// Accessibility and behaviour hooks.
assert.ok(src.includes('aria-live="polite"'), "live region announces each milestone")
assert.ok(/aria-current=\{i === active \? "step"/.test(src), "rail marks the current year")
assert.ok(/maxShift = Infinity/.test(src), "the last milestone rests on the same left line as the others")
assert.ok(/aria-label=\{labels\?\.previous \|\| "Previous milestone"\}/.test(src))
assert.ok(/aria-label=\{labels\?\.next \|\| "Next milestone"\}/.test(src))
assert.ok(/"ArrowRight"/.test(src) && /"ArrowLeft"/.test(src) && /"Home"/.test(src) && /"End"/.test(src), "keyboard navigation")
assert.ok(/prefers-reduced-motion: reduce/.test(src) && /prefers-reduced-motion:reduce/.test(css), "reduced motion in JS and CSS")
assert.ok(/passive: false/.test(src) && /Math\.abs\(dx\) <= Math\.abs\(e\.deltaY\)/.test(src), "wheel only takes horizontal intent")
assert.ok(/:where\(\.dark\) \.sht\[data-theme=auto\]/.test(css), "auto theme follows a .dark ancestor")
assert.ok(/touch-action:pan-y/.test(css), "vertical page scroll survives on touch")

// 21st CLI: no generics before the first JSX close tag.
const head = src.slice(0, src.indexOf("</"))
assert.equal(head.match(/use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /g), null)

console.log("seam-history-timeline: ok")
