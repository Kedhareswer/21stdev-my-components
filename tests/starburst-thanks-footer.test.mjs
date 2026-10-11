// Runnable check for components/starburst-thanks-footer: the marker alphabet,
// star, pen loop and language cycle, plus the install-safety rules.
// Run: node tests/starburst-thanks-footer.test.mjs
//
// What breaks silently here: a glyph whose path strays outside its advance and
// collides with the next letter, an accented word that writes with holes in it,
// a loop that closes into a tidy ellipse (or leaves its box and gets clipped),
// and a star click that walks the index off the end of the list.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/starburst-thanks-footer/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("starburst-thanks-footer.tsx")

const start = src.indexOf("// #region signoff")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "signoff region markers missing")
const T = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const nums = (d) => (d.match(/-?\d*\.?\d+/g) ?? []).map(Number)

// ---- the marker alphabet -------------------------------------------------------
{
  for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.,':-/&") assert.ok(T.GLYPHS[ch], "missing glyph " + ch)
  for (const [ch, [w, d]] of Object.entries(T.GLYPHS)) {
    assert.match(d, /^M/, ch + " starts with a move")
    assert.doesNotMatch(d, /[^MLQZ\d.\s-]/, ch + " uses absolute M/L/Q/Z only")
    const n = nums(d)
    assert.equal(n.length % 2, 0, ch + " has an odd coordinate count")
    for (let i = 0; i < n.length; i += 2) {
      assert.ok(n[i] >= -0.01 && n[i] <= w + 0.01, ch + " x " + n[i] + " outside its advance " + w)
      assert.ok(n[i + 1] >= -0.01 && n[i + 1] <= 11.01, ch + " y " + n[i + 1] + " off the line")
    }
  }
}

// ---- layout --------------------------------------------------------------------
{
  const a = T.layoutScript("For your time", 3)
  assert.equal(a.glyphs.length, 11, "spaces take room but draw nothing")
  for (let i = 1; i < a.glyphs.length; i++) assert.ok(a.glyphs[i].x > a.glyphs[i - 1].x, "letters advance")
  assert.deepEqual(T.layoutScript("For your time", 3), a, "reproducible")
  assert.deepEqual(T.layoutScript("FOR YOUR TIME", 3), a, "case doesn't matter")
  const last = a.glyphs.at(-1)
  assert.equal(a.width, Math.round((last.x + last.w) * 100) / 100, "width ends at the last ink")
  for (const g of a.glyphs) {
    assert.ok(Math.abs(g.dy) <= 0.55 && Math.abs(g.rot) <= 4, "jitter stays small")
  }
  const flat = T.layoutScript("RV", 0, 1.6, 0)
  assert.ok(flat.glyphs.every((g) => g.dy === 0 && g.rot === 0), "jitter 0 is dead straight")
  // Accents are stripped, not dropped.
  assert.deepEqual(
    T.layoutScript("Teşekkürler").glyphs.map((g) => g.d),
    T.layoutScript("TESEKKURLER").glyphs.map((g) => g.d),
  )
  // Unknown characters are spaces, never NaN.
  const odd = T.layoutScript("hi 🙂 there")
  assert.equal(odd.glyphs.length, 7)
  assert.ok(odd.glyphs.every((g) => Number.isFinite(g.x)))
  assert.deepEqual(T.layoutScript(""), { glyphs: [], width: 0 })
  assert.deepEqual(T.layoutScript(undefined), { glyphs: [], width: 0 })
}

// ---- the star ------------------------------------------------------------------
{
  const d = T.starPath(10, 46, 20, 0, 0, 0.22, 2)
  assert.match(d, /^M.*Z$/)
  assert.equal(d.split("L").length, 20, "ten spikes, twenty vertices")
  const n = nums(d)
  for (let i = 0; i < n.length; i += 2) assert.ok(Math.hypot(n[i], n[i + 1]) <= 52, "inside its -52..52 viewBox")
  assert.equal(T.starPath(1, 5, 2).split("L").length, 6, "fewer than three points is three")
  assert.equal(T.starPath(NaN, 5, 2).split("L").length, 6)
  assert.equal(T.starPath(10, 46, 20, 0, 0, 0.22, 2), d, "reproducible")
}

// ---- the pen loop ----------------------------------------------------------------
{
  const d = T.loopPath()
  const n = nums(d)
  for (let i = 0; i < n.length; i += 2) {
    assert.ok(n[i] >= 0 && n[i] <= 100 && n[i + 1] >= 0 && n[i + 1] <= 40, "loop leaves its box at " + n[i] + "," + n[i + 1])
  }
  const gap = Math.hypot(n[0] - n.at(-2), n[1] - n.at(-1))
  assert.ok(gap > 2, "the ends overshoot instead of closing")
  assert.doesNotMatch(d, /Z/, "and it is never closed")
}

// ---- the language cycle ----------------------------------------------------------
{
  assert.equal(T.cycle(0, 7), 1)
  assert.equal(T.cycle(6, 7), 0, "wraps")
  assert.equal(T.cycle(0, 0), 0, "empty list stays at 0")
  assert.equal(T.cycle(NaN, 3), 0)
  assert.equal(T.cycle(-1, 3), 0)
  assert.equal(T.initialsOf("  Rio   Valente Silva "), "RV")
  assert.equal(T.initialsOf("cher"), "C")
  assert.equal(T.initialsOf(""), "")
  const dd = T.dust(22, 3)
  assert.equal(dd.length, 22)
  assert.ok(dd.every((p) => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100 && p.o < 0.6))
  assert.deepEqual(T.dust(-4), [])
}

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import")
assert.doesNotMatch(code, /["+]\s*(\*|body|:root|html)\s*{/, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks")
assert.doesNotMatch(code, /\$\{/, "no template interpolation")
assert.doesNotMatch(code, /https?:\/\/(?!www\.w3\.org)/, "nothing is fetched")
assert.doesNotMatch(code, /innerWidth|innerHeight|scrollY/, "size from the element, not the window")
assert.doesNotMatch(code, /\bh-(full|screen)\b/, "no percentage-height classes")
assert.doesNotMatch(code, /localStorage|sessionStorage/, "no storage")

const css = src.slice(src.indexOf("const CSS ="), src.indexOf("const useStrokeLengths"))
for (const m of css.matchAll(/"([^"]*)\{/g)) {
  const sel = m[1].replace(/^.*\}/, "")
  if (!sel || sel.startsWith("@")) continue
  assert.ok(/^(\.stf|:where\(\.stf\)|from|to|\d+%)/.test(sel.trim()), "unscoped CSS rule: " + sel)
}
assert.ok(css.includes(":where(.stf) button{"), "buttons are reset at zero specificity")

// Height is a definite prop, applied as a minimum so narrow screens can grow.
assert.ok(src.includes('height = "100svh"'), "definite default height")
assert.ok(src.includes("minHeight: height"))
assert.ok(src.includes("container-type:inline-size"), "the root is a size container")
// overflow:hidden is still a scroll container: focusing the star scrolled the
// oversized grain layer sideways. clip is not.
assert.ok(css.includes("overflow:hidden;overflow:clip;"), "the root clips instead of scrolling")
assert.ok(src.includes("@container (max-width: 640px)"), "contacts stack when narrow")
assert.ok((css.match(/max-width:none/g) || []).length >= 6, "svgs opt out of Preflight's max-width")

// Motion.
assert.ok(css.includes("@media (prefers-reduced-motion: reduce){"), "honours reduced motion")
assert.ok(src.includes('window.matchMedia?.("(prefers-reduced-motion: reduce)")'), "the star pop does too")
assert.ok(src.includes("io.disconnect()"), "the observer is cleaned up")
assert.ok(src.includes("clearTimeout(id)"), "the copied timer is cleaned up")

// Accessibility.
assert.ok(src.includes('<span className="stf-sr">{word + " " + tagline}</span>'), "the headline is text")
assert.ok(src.includes('role="status"'), "copying is announced")
assert.ok(src.includes('aria-label={"Say thanks another way (now: " + word + ")"}'), "the star is a labelled button")
assert.ok(src.includes('if (!l.href || l.href === "#") e.preventDefault()'), "# links leave the page hash alone")
assert.ok(src.includes('window.location.href = "mailto:" + email'), "no clipboard falls back to mail")

for (const f of ["demo.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/starburst-thanks-footer"'), f + " imports the installer path")
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), f + ": " + cls + " has no width")
}

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(
  tsconfig.includes('"@/components/ui/starburst-thanks-footer": ["./components/starburst-thanks-footer/starburst-thanks-footer.tsx"]'),
  "tsconfig path missing",
)

console.log("starburst-thanks-footer: ok")
