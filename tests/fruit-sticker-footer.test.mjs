// Runnable check for components/fruit-sticker-footer: the script alphabet, the
// pen timing, the sticker maths, plus the install-safety rules.
// Run: node tests/fruit-sticker-footer.test.mjs
//
// What breaks silently here: a glyph whose path has a dangling coordinate (the
// browser draws up to the error and drops the rest of the letter, so "c" loses
// its tail and nothing throws), a joined letter whose ends don't sit on the
// join (the word looks stitched together), and a dot that's drawn as a
// zero-length stroke (pathLength=1 on a zero-length path never animates in).
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/fruit-sticker-footer/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("fruit-sticker-footer.tsx")

const start = src.indexOf("// #region script")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "script region markers missing")
const S = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- every glyph path is well formed ----------------------------------------
const ARITY = { M: 2, L: 2, C: 6 }
const parse = (d) => {
  const segs = []
  for (const m of d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)) {
    const nums = (m[2].match(/-?\d*\.?\d+/g) || []).map(Number)
    segs.push([m[1], nums])
  }
  return segs
}
for (const [ch, [adv, d]] of Object.entries(S.GLYPHS)) {
  assert.ok(adv > 0, ch + " has an advance")
  if (ch === " ") {
    assert.equal(d, "", "a space draws nothing")
    continue
  }
  const segs = parse(d)
  assert.equal(segs[0][0], "M", ch + " starts with a move")
  for (const [cmd, nums] of segs) {
    assert.ok(cmd in ARITY, ch + ": only M, L and C are used (got " + cmd + ")")
    assert.ok(nums.length > 0 && nums.length % ARITY[cmd] === 0, ch + ": " + cmd + " takes " + ARITY[cmd] + " numbers per segment, got " + nums.length)
    for (const n of nums) assert.ok(Number.isFinite(n), ch + ": finite coordinates")
  }
  // stays inside the box the svg reserves for it
  for (const [, nums] of segs) {
    for (let i = 1; i < nums.length; i += 2) {
      assert.ok(nums[i] > S.SCRIPT_TOP + S.SCRIPT_STROKE / 2 && nums[i] < S.SCRIPT_BOTTOM - S.SCRIPT_STROKE / 2, ch + " fits between SCRIPT_TOP and SCRIPT_BOTTOM")
    }
  }
}

// ---- joined letters meet on the join ----------------------------------------
{
  const endOf = (d) => {
    const nums = (d.match(/-?\d*\.?\d+/g) || []).map(Number)
    return nums.slice(-2)
  }
  for (const ch of "abcdefghijklmnopqrstuvwxyz") {
    const [adv, d] = S.GLYPHS[ch]
    assert.ok(d.startsWith("M0,-14"), ch + " starts on the join")
    // the joining stroke is the first subpath that ends at the advance
    const subs = d.split(/(?=M)/)
    const joins = subs.filter((s) => {
      const [x, y] = endOf(s)
      return x === adv && y === -14
    })
    assert.ok(joins.length >= 1, ch + " ends on the join at (" + adv + ",-14)")
  }
}

// ---- layout ------------------------------------------------------------------
{
  for (const w of ["bye!", "ciao!", "later!", "adios!", "cheers!", "see ya!", "toodles!"]) assert.ok(S.supports(w), w + " is supported")
  assert.ok(S.supports("Adiós!"), "accents and capitals fold")
  assert.ok(S.supports("it’s"), "curly apostrophes fold")
  assert.ok(!S.supports("bye\u{1F44B}"), "an emoji isn't")

  const bye = S.layoutWord("bye!")
  assert.equal(bye.glyphs.length, 4)
  assert.deepEqual(bye.glyphs.map((g) => g.x), [0, 92, 188, 268], "advances accumulate")
  assert.equal(bye.width, 92 + 96 + 80 + 56)
  const bang = bye.glyphs[3]
  assert.equal(bang.strokes.length, 1, "the ! is a stroke")
  assert.deepEqual(bang.dots, [[22, -8]], "and a dot, drawn as a circle")
  const i = S.layoutWord("i").glyphs[0]
  assert.equal(i.dots.length, 1, "the i has its tittle")
  for (const g of S.layoutWord("abcdefghijklmnopqrstuvwxyz!?.,'").glyphs) {
    for (const s of g.strokes) assert.ok(s.len > 5, g.ch + ": no zero-length strokes reach pathLength=1")
  }
  // unknown characters take a space's width rather than throwing
  const odd = S.layoutWord("a\u{1F44B}b")
  assert.equal(odd.glyphs[1].strokes.length + odd.glyphs[1].dots.length, 0)
  assert.equal(odd.width, S.GLYPHS.a[0] + S.GLYPHS[" "][0] + S.GLYPHS.b[0])
}

// ---- path length -------------------------------------------------------------
{
  assert.equal(S.pathLength("M0,0L30,40"), 50)
  const straight = S.pathLength("M0,0C10,0 20,0 30,0")
  assert.ok(Math.abs(straight - 30) < 1e-9, "a flat curve is as long as its chord")
  const quarter = S.pathLength("M100,0C100,55.23 55.23,100 0,100")
  assert.ok(Math.abs(quarter - (Math.PI * 100) / 2) < 0.5, "a quarter circle is ~157")
}

// ---- pen timing: constant speed, never overlapping ---------------------------
{
  const { glyphs, total } = S.timeWord(S.layoutWord("bye!").glyphs)
  let t = 0
  for (const g of glyphs) {
    for (const s of g.strokes) {
      assert.ok(s.delay >= t - 1e-9, "strokes start after the previous one ends")
      assert.ok(Math.abs(s.dur - Math.max(0.08, s.len / S.PEN_SPEED)) < 1e-9, "duration follows length")
      t = s.delay + s.dur
    }
    for (const d of g.dots) {
      assert.ok(d.delay >= t, "dots land after their strokes")
      t = d.delay
    }
  }
  assert.ok(total > 0.8 && total < 2.2, "bye! writes itself in about a second (" + total.toFixed(2) + "s)")
}

// ---- sticker maths -----------------------------------------------------------
{
  assert.equal(S.clampOffset(0.5, -0.2, 0.3), 0.3)
  assert.equal(S.clampOffset(-0.5, -0.2, 0.3), -0.2)
  assert.equal(S.clampOffset(0.1, -0.2, 0.3), 0.1)
  assert.equal(S.clampOffset(0.1, 0.4, 0.2), 0.30000000000000004, "an impossible range centres instead of flipping")
  let x = 0
  let v = 0
  for (let k = 0; k < 400; k++) [x, v] = S.spring(x, v, 100, 0.16, 0.66)
  assert.ok(Math.abs(x - 100) < 0.01 && Math.abs(v) < 0.01, "the resting spring settles on its target")
  x = 0
  v = 0
  let peak = 0
  for (let k = 0; k < 400; k++) {
    ;[x, v] = S.spring(x, v, 100, 0.16, 0.66)
    peak = Math.max(peak, x)
  }
  assert.ok(peak > 100 && peak < 115, "with a little overshoot, not a wobble (" + peak.toFixed(1) + ")")
}

// ---- install safety ----------------------------------------------------------
const code = src.replace(/\/\/[^\n]*/g, "")
assert.doesNotMatch(code, /from\s+["'](?!react["'])/, "React is the only import")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /["+]\s*(\*|body|:root|html)\s*{/, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks — CSS is built by concatenation")
assert.doesNotMatch(code, /\$\{/, "no template interpolation")
assert.doesNotMatch(code, /https?:\/\/(?!www\.w3\.org)/, "nothing is fetched")
assert.doesNotMatch(code, /innerWidth|innerHeight|scrollY/, "size from the element, not the window")
assert.doesNotMatch(code, /\bh-(full|screen)\b/, "no percentage-height classes")
assert.doesNotMatch(code, /localStorage|sessionStorage/, "no storage")

const css = src.slice(src.indexOf("const CSS ="), src.indexOf("// ---- component"))
for (const m of css.matchAll(/"([^"]*)\{/g)) {
  const sel = m[1].replace(/^.*\}/, "")
  if (!sel || sel.startsWith("@")) continue
  for (const part of sel.split(",")) assert.ok(/^(\.fsf|:where\(\.fsf\)|from|to|\d+%)/.test(part.trim()), "unscoped CSS rule: " + part)
}
assert.ok(css.includes(":where(.fsf) button{"), "buttons are reset at zero specificity")
assert.ok(css.includes(":where(.fsf) *{box-sizing:border-box}"), "box-sizing without out-ranking the host")

// Height is a definite prop, applied as a minimum; the root has no % height.
assert.ok(src.includes('height = "100svh"'), "definite default height")
assert.ok(src.includes("minHeight: height"))
assert.doesNotMatch(css.slice(css.indexOf('".fsf{'), css.indexOf('":where(.fsf) *')), /height:100%/, "the root has no percentage height")
assert.ok(css.includes("container-type:inline-size"), "the root is a size container")
assert.ok(/cqw/.test(css), "sizes follow the component's width")
assert.ok(src.includes("@container (max-width: 640px)"), "stacks when narrow")
assert.ok(css.includes("overflow:hidden;overflow:clip;"), "the root clips instead of scrolling")
assert.ok((css.match(/max-width:none/g) || []).length >= 5, "svgs opt out of Preflight's max-width")

// Motion.
assert.ok(css.includes("@media (prefers-reduced-motion: reduce){"), "CSS motion stops")
assert.ok(src.includes('window.matchMedia("(prefers-reduced-motion: reduce)")'), "the spring loop reads it too")
assert.ok(src.includes("if (a.reduced || typeof IntersectionObserver"), "and skips the entrance")
assert.ok(src.includes("new IntersectionObserver"), "the entrance waits until it's seen")
assert.ok(src.includes("a.raf = busy ? requestAnimationFrame(step) : 0"), "the loop sleeps when settled")
assert.ok(src.includes("pathLength={1}"), "strokes draw with normalised dashes")

// Cleanup.
for (const gone of ["io?.disconnect()", "ro.disconnect()", "cancelAnimationFrame(a.raf)", 'removeEventListener("change", onMq)', "clearTimeout(id)", "clearTimeout(eraseTimer.current)"]) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}

// Accessibility and input.
assert.ok(src.includes('<span className="fsf-sr">{headline + " " + word}</span>'), "the headline exists as text")
assert.ok(src.includes('aria-label={"Say goodbye another way (now: " + word + ")"}'), "the script is a labelled button")
assert.ok(src.includes('" sticker. Press Enter to swap the fruit, arrow keys to move it."'), "stickers say what they do")
assert.ok(src.includes('role="status"'), "copying is announced")
assert.ok(src.includes('window.location.href = "mailto:" + email'), "no clipboard falls back to mail")
assert.ok(src.includes('if (!l.href || l.href === "#") e.preventDefault()'), "'#' links leave the hash alone")
assert.ok(css.includes("touch-action:none"), "stickers drag on touch")
assert.ok(src.includes("if (e.detail === 0) swap(i)"), "keyboard clicks swap, pointer clicks don't swap twice")
assert.ok(src.includes("setPointerCapture"), "a fast drag doesn't lose the sticker")

// Every fruit has art, a paper colour and a name.
const fruits = src.match(/export const FRUITS: Fruit\[\] = \[([^\]]*)\]/)[1].match(/"[a-z]+"/g).map((s) => s.slice(1, -1))
assert.equal(fruits.length, 8)
for (const f of fruits) {
  for (const table of ["const ART", "const PAPER", "const NAMES"]) {
    const body = src.slice(src.indexOf(table), src.indexOf("\n}\n", src.indexOf(table)))
    assert.ok(new RegExp("\\n  " + f + ":").test(body), table + " is missing " + f)
  }
}

// A demo wrapper left at width:auto collapses inside 21st's centring flex.
for (const f of ["demo.tsx", "demo-remix.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/fruit-sticker-footer"'), f + " imports the installer path")
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), f + ": " + cls + " has no width")
}

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(
  tsconfig.includes('"@/components/ui/fruit-sticker-footer": ["./components/fruit-sticker-footer/fruit-sticker-footer.tsx"]'),
  "tsconfig path missing",
)

console.log("fruit-sticker-footer: ok")
