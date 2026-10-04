// Runnable check for components/shutter-glyph-footer: the alphabet, the shutter,
// layout, scramble and form maths, plus the install-safety rules.
// Run: node tests/shutter-glyph-footer.test.mjs
//
// What breaks silently here: a glyph whose path has a NaN in it (the letter just
// isn't there), a letter drawn outside its own box (it overlaps its neighbour),
// a shutter blade that leaves the square when the pivot is clamped, a rotation
// that doesn't come back to itself after four clicks, and a scramble that
// changes the line's length so the arrow jitters.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/shutter-glyph-footer/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("shutter-glyph-footer.tsx")

const start = src.indexOf("// #region glyphs")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "glyph region markers missing")
const T = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const nums = (d) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)

// ---- primitives ----------------------------------------------------------------
{
  assert.equal(T.rect(0, 0, 10, 20), "M0 0H10V20H0Z")
  assert.equal(T.slant(0, 0, 5, 10, 2), "M0 0H2L7 10H5Z")
  assert.equal(T.poly([0, 0, 1, 0, 1, 1]), "M0 0L1 0L1 1Z")
  // A quarter band from right to bottom: outer arc clockwise, inner back.
  const q = T.band(50, 50, 50, 50, 10, 10, 0, 90)
  assert.ok(q.startsWith("M100 50A50 50 0 0 1 50 100L50 90A40 40 0 0 0 90 50Z"), q)
  assert.ok(T.band(50, 50, 50, 50, 10, 10, 0, -270).includes(" 0 1 0 "), "a long anticlockwise band is large-arc, sweep 0")
  // Bowl: both contours bulge right (same sweep), so evenodd leaves a hole, not a lens.
  const b = T.bowl(0, 0, 80, 60, 19, 17)
  assert.equal((b.match(/ 0 0 1 /g) || []).length, 2, "both bowl arcs sweep the same way")
  assert.equal((T.ring(50, 50, 50, 50, 20, 17).match(/Z/g) || []).length, 2, "a ring is two contours")
}

// ---- every letter is drawable and stays in its box -----------------------------
{
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  assert.deepEqual(Object.keys(T.GLYPHS).sort().join(""), letters, "exactly A–Z")
  for (const ch of letters) {
    const g = T.GLYPHS[ch]
    assert.ok(g.w > 0 && g.d.length > 0, ch + " has width and shapes")
    for (const d of g.d) {
      assert.match(d, /^M[\d.\- HVLAZM]+$/, ch + " path is plain absolute commands")
      assert.doesNotMatch(d, /NaN|Infinity/, ch + " has a bad number")
      // Points (not arc radii/flags) stay inside the glyph box, with 1 unit of slack.
      for (const seg of d.split(/(?=[MLHVAZ])/)) {
        const n = nums(seg.slice(1))
        const cmd = seg[0]
        const pts = cmd === "A" ? n.slice(5) : cmd === "H" ? [n[0], 0] : cmd === "V" ? [0, n[0]] : n
        for (let i = 0; i + 1 < pts.length; i += 2) {
          assert.ok(pts[i] >= -1 && pts[i] <= g.w + 1, ch + " x " + pts[i] + " outside 0.." + g.w)
          assert.ok(pts[i + 1] >= -1 && pts[i + 1] <= T.CAP + 1, ch + " y " + pts[i + 1] + " outside the cap")
        }
      }
    }
  }
  assert.equal(T.glyphOf("a"), T.GLYPHS.A, "lower case maps to the capital")
  assert.equal(T.glyphOf("7").d.length, 0, "anything else is a gap")
  assert.ok(T.glyphOf(" ").w > 0)
}

// ---- the S spine is exactly one bar thick --------------------------------------
{
  // r = (CAP + B) / 4: upper bowl bottoms out at 2r, lower tops out at CAP - 2r.
  const r = 29.25
  assert.ok(Math.abs(2 * r - (T.CAP - 2 * r) - 17) < 1e-9)
}

// ---- the shutter -----------------------------------------------------------------
{
  assert.deepEqual(T.turn(10, 20, 0), [10, 20])
  assert.deepEqual(T.turn(10, 20, 1), [80, 10], "a quarter turn clockwise")
  assert.deepEqual(T.turn(10, 20, 4), [10, 20], "four quarters are home")
  assert.deepEqual(T.turn(...T.turn(10, 20, 3), -3), [10, 20], "turn back undoes turn")
  assert.deepEqual(T.turn(10, 20, -1), T.turn(10, 20, 3))
  assert.deepEqual(T.restPivot(0), [77, 77], "rests where the reference glyph does")

  for (let turns = 0; turns < 4; turns++) {
    for (const [x, y] of [[77, 77], [50, 50], [-50, 400], [8, 8], [NaN, 50]]) {
      const bl = T.blades(x, y, turns)
      assert.equal(bl.length, 3, "three blades")
      for (const pts of bl) {
        assert.equal(pts.length, 8, "each blade is a quad")
        for (const v of pts) {
          if (Number.isNaN(x)) continue
          assert.ok(v >= 0 && v <= T.SHUTTER, "blade point " + v + " leaves the square")
        }
      }
      // All three blades meet at the pivot.
      if (Number.isNaN(x)) continue
      const [px, py] = [Math.min(92, Math.max(8, x)), Math.min(92, Math.max(8, y))]
      for (const pts of bl) {
        let hit = false
        for (let i = 0; i < 8; i += 2) if (Math.abs(pts[i] - px) < 1e-9 && Math.abs(pts[i + 1] - py) < 1e-9) hit = true
        assert.ok(hit, "blade meets the pivot at turn " + turns)
      }
    }
  }
  // The unrotated blades match the reference: a top-left wedge, a top band from
  // the pivot's x, a left band from the pivot's y.
  assert.deepEqual(T.blades(77, 77, 0), [
    [0, 0, 21, 0, 77, 77, 0, 21],
    [77, 0, 100, 0, 100, 21, 77, 77],
    [0, 77, 77, 77, 21, 100, 0, 100],
  ])
}

// ---- layout ----------------------------------------------------------------------
{
  const { items, width } = T.layout("VANDA", 2)
  assert.equal(items.length, 5)
  assert.deepEqual(items.map((i) => i.shutter), [false, false, true, false, false])
  assert.equal(items[2].w, T.SHUTTER, "the shutter is square")
  assert.equal(items[1].x, T.GLYPHS.V.w + 12)
  assert.equal(width, items[4].x + items[4].w, "no trailing gap")
  assert.ok(!T.layout("A B", 1).items[1].shutter, "a space never becomes the shutter")
  assert.ok(T.layout("VANDA", -1).items.every((i) => !i.shutter), "-1 is none")
  assert.ok(T.layout("", 0).width > 0, "an empty word still has a viewBox")
}

// ---- motion maths ----------------------------------------------------------------
{
  const one = T.approach(0, 100, 0.12, 1 / 30)
  const two = T.approach(T.approach(0, 100, 0.12, 1 / 60), 100, 0.12, 1 / 60)
  assert.ok(Math.abs(one - two) < 1e-9, "30Hz and 60Hz arrive at the same place")
  assert.equal(T.approach(5, 100, 0.1, 0), 5)
  assert.ok(T.approach(0, 100, 0.1, 5) < 100, "a stalled tab never overshoots")
}

// ---- scramble ----------------------------------------------------------------------
{
  const text = "Terms & Conditions"
  assert.equal(T.scramble(text, 1, 3), text, "done is the label")
  for (const p of [0, 0.3, 0.7]) {
    const s = T.scramble(text, p, 3)
    assert.equal(Array.from(s).length, Array.from(text).length, "same length at " + p)
    assert.equal(s[5], " ")
    assert.equal(s[6], "&", "punctuation never scrambles")
  }
  assert.equal(T.scramble(text, 0.5, 3), T.scramble(text, 0.5, 3), "deterministic for a seed")
  assert.equal(T.scramble(text, 0.5, 3).slice(0, 9), text.slice(0, 9), "the settled part is the label")
  assert.notEqual(T.scramble(text, 0, 3), text, "unsettled letters change")
  assert.equal(T.scramble(text, NaN, 3), text, "a bad progress is done")
}

// ---- form + colour -----------------------------------------------------------------
{
  for (const ok of ["a@b.co", " hi@studio.design ", "first.last+tag@mail.example.org"]) assert.ok(T.isEmail(ok), ok)
  for (const bad of ["", "nope", "a@b", "a@b.c", "a b@c.de", "@b.co", undefined]) assert.ok(!T.isEmail(bad), String(bad))
  assert.deepEqual(T.parseHex("#f9531f"), [249, 83, 31])
  assert.deepEqual(T.parseHex("F53"), [255, 85, 51])
  assert.equal(T.parseHex("tomato"), null)
  assert.equal(T.mixHex("#000000", "#ffffff", 0.5), "#808080")
  assert.equal(T.mixHex("#f9531f", "#ffffff", 0), "#f9531f")
  assert.equal(T.mixHex("#f9531f", "#ffffff", 9), "#ffffff", "t is clamped")
  assert.equal(T.mixHex("tomato", "#ffffff", 0.2), "tomato", "unparseable passes through")
}

// ---- install safety --------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /["+]\s*(\*|body|:root|html)\s*{/, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks — CSS is built by concatenation")
assert.doesNotMatch(code, /\$\{/, "no template interpolation")
assert.doesNotMatch(code, /url\(["']?https?:/, "nothing is fetched")
assert.doesNotMatch(code, /<img|new Image|fetch\(/, "no images or requests")
assert.doesNotMatch(code, /innerWidth|innerHeight|scrollY/, "size from the element, not the window")
assert.doesNotMatch(code, /\bh-(full|screen)\b|height:100%/, "no percentage heights")
assert.doesNotMatch(code, /localStorage|sessionStorage/, "no storage")

const css = src.slice(src.indexOf("const CSS ="), src.indexOf("const Arrow ="))
for (const m of css.matchAll(/"([^"]*)\{/g)) {
  const sel = m[1].replace(/^.*\}/, "")
  if (!sel || sel.startsWith("@")) continue
  for (const part of sel.split(",")) {
    assert.ok(/^(\.sgf|:where\(\.sgf\)|from|to|\d+%)/.test(part.trim()), "unscoped CSS rule: " + part)
  }
}
assert.ok(css.includes(":where(.sgf) a{"), "links are reset at zero specificity")
assert.ok(css.includes(".sgf svg{max-width:none}"), "svgs opt out of Preflight's max-width")
assert.ok(css.includes("container-type:inline-size"), "the root is a size container")
assert.ok(css.includes("@container (max-width: 760px)") && css.includes("@container (max-width: 420px)"), "stacks when narrow")

// The wordmark has an intrinsic height from its own viewBox.
assert.ok(src.includes('viewBox={"0 0 " + f(width) + " " + CAP}'), "viewBox is the laid-out word")
assert.ok(src.includes('style={{ aspectRatio: width + " / " + CAP }}'), "the svg has an aspect ratio, not a percentage height")
assert.ok(src.includes('clipPathUnits="userSpaceOnUse"'), "slice clips are in glyph units")
assert.ok(src.includes('React.useId().replace(/[^a-zA-Z0-9_-]/g, "")'), "clip ids are url()-safe on every React version")
assert.ok(/height=\{252\.6\}/.test(src) && /y=\{51\.4\}/.test(src), "the two halves overlap so the cut never shows a hairline")

// Motion.
assert.ok(src.includes("prefers-reduced-motion"), "reads prefers-reduced-motion")
assert.ok(css.includes("@media (prefers-reduced-motion: reduce){"), "and stops the CSS transitions")
assert.ok(src.includes("const still = reduced || !animate"), "one switch for both")
assert.ok(src.includes("if (still || !el) return"), "links don't scramble")
assert.ok(src.includes("if (still) return\n    const el = e.currentTarget"), "letters don't flip")
assert.ok(src.includes("if (still || !visible) {"), "the shutter holds at rest")
assert.ok(src.includes('data-in={seen || still ? "true" : "false"}'), "reduced motion never waits for a reveal")
assert.ok(src.includes("new IntersectionObserver"), "work stops off screen")

// Cleanup.
for (const gone of ["io.disconnect()", "cancelAnimationFrame(raf)", "cancelAnimationFrame(raf.current)", "window.clearInterval(id)", 'removeEventListener("change", onMq)', "alive.current = false"]) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}

// Accessibility.
assert.ok(src.includes('<p className="sr-only">{word}</p>'), "the wordmark exists as text")
assert.ok(/className="sgf-svg"[\s\S]{0,200}aria-hidden="true"/.test(src), "the drawn letters are hidden from readers")
assert.ok(src.includes("aria-label={text}"), "scrambling links keep a stable name")
assert.ok(src.includes('<span ref={textRef} aria-hidden="true">'), "and the noise is never read")
assert.ok(src.includes('htmlFor={"sgf-email-" + uid}'), "the field is labelled")
assert.ok(src.includes('aria-live="polite"'), "errors are announced")
assert.ok(src.includes('aria-label="Subscribe"'), "the arrow button is named")
assert.ok(src.includes("aria-invalid="), "an invalid address is marked")
assert.ok(src.includes('if (!l.href || l.href === "#") e.preventDefault()'), "'#' never rewrites the host's hash")
assert.ok(src.includes("if (!alive.current) return"), "no state update after unmount")

// Defaults match the reference: three socials, three legal links.
const defaults = (name) => (src.match(new RegExp("const " + name + "[^=]*= \\[([\\s\\S]*?)\\n\\]")) ?? [, ""])[1]
assert.equal(defaults("DEFAULT_SOCIALS").match(/label:/g).length, 3)
assert.equal(defaults("DEFAULT_LEGAL").match(/label:/g).length, 3)

for (const f of ["demo.tsx", "demo-night.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/shutter-glyph-footer"'), f + " imports the installer path")
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), f + ": " + cls + " has no width")
}

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/shutter-glyph-footer": ["./components/shutter-glyph-footer/shutter-glyph-footer.tsx"]'), "tsconfig path missing")

console.log("shutter-glyph-footer: ok")
