// Runnable check for components/sticker-slap-footer: the script alphabet, the
// word layout, sticker spots, plus the install-safety rules.
// Run: node tests/sticker-slap-footer.test.mjs
//
// What breaks silently here: a glyph that doesn't start or end on the join
// point (the word's one stroke kinks or jumps), a lift that isn't a move (the
// pen drags a line across the word), an accent that writes a hole, stickers
// that land off the word or all on top of each other, and a draw-in whose dash
// length is unitless next to a px offset (the calc is invalid, the dash is
// dropped and the word just appears).
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/sticker-slap-footer/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("sticker-slap-footer.tsx")

const start = src.indexOf("// #region slap")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "slap region markers missing")
const T = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const nums = (d) => (d.match(/-?\d*\.?\d+/g) ?? []).map(Number)

// ---- the script alphabet ---------------------------------------------------------
{
  for (const ch of "abcdefghijklmnopqrstuvwxyz!.") assert.ok(T.SCRIPT[ch], "missing glyph " + ch)
  for (const [ch, [w, main, extra = "", lift]] of Object.entries(T.SCRIPT)) {
    for (const d of [main, extra].filter(Boolean)) {
      assert.match(d, /^M/, ch + " starts with a move")
      assert.doesNotMatch(d, /[^MLCZ\d.\s-]/, ch + " uses absolute M/L/C only")
      const n = nums(d)
      assert.equal(n.length % 2, 0, ch + " has an odd coordinate count")
      for (let i = 0; i < n.length; i += 2) {
        assert.ok(n[i] >= -1 && n[i] <= w + 0.01, ch + " x " + n[i] + " outside its advance " + w)
        assert.ok(n[i + 1] >= -20.1 && n[i + 1] <= 10, ch + " y " + n[i + 1] + " off the body")
      }
    }
    if (ch === "!" || ch === ".") continue
    const n = nums(main)
    assert.deepEqual([n[0], n[1]], [0, -1], ch + " starts on the join")
    if (!lift) assert.deepEqual(n.slice(-2), [w, -1], ch + " ends on the join")
  }
}

// ---- layout -------------------------------------------------------------------------
{
  const w = T.layoutScript("sunny")
  assert.equal(w.boxes.length, 5)
  assert.equal((w.main.match(/M/g) ?? []).length, 1, "a joined word is one stroke")
  assert.equal(w.extra.length, 0)
  for (let i = 1; i < w.boxes.length; i++) assert.ok(w.boxes[i].x0 > w.boxes[i - 1].x0, "letters advance")
  assert.ok(w.width > 0 && w.top <= -10 && w.bottom >= 9, "x-height and the y's tail")
  assert.deepEqual(T.layoutScript("SUNNY"), w, "case doesn't matter")
  // o, r, v, w lift: the next letter starts with a move, never a dragged line.
  assert.equal((T.layoutScript("ox").main.match(/M/g) ?? []).length, 2)
  // Pen lifts come after the stroke: crosses and dots.
  assert.equal(T.layoutScript("tutti").extra.length, 4)
  // Accents stripped, unknowns are spaces, nothing is NaN.
  assert.equal(T.layoutScript("Olá").main, T.layoutScript("ola").main)
  const odd = T.layoutScript("hi 🙂 you")
  assert.equal(odd.boxes.length, 5)
  assert.doesNotMatch(odd.main + odd.extra.join(""), /NaN|undefined/)
  assert.equal((odd.main.match(/M/g) ?? []).length, 3, "spaces lift the pen")
  assert.deepEqual(T.layoutScript(""), { main: "", extra: [], width: 0, top: 0, bottom: 0, boxes: [] })
  assert.equal(T.layoutScript(undefined).width, 0)
  assert.equal(T.place("M1 -1L2 -3", 10, 2), "M12 -1L14 -3", "x moves, y stays")
}

// ---- stickers -------------------------------------------------------------------------
{
  const w = T.layoutScript("sunny")
  const s = T.stickerSpots(w, 6, 3)
  assert.equal(s.length, 6)
  assert.deepEqual(T.stickerSpots(w, 6, 3), s, "reproducible")
  for (let i = 0; i < s.length; i++) {
    const p = s[i]
    assert.ok(p.x >= -2 && p.x <= w.width + 2, "sticker " + i + " lands on the word")
    assert.ok(p.y <= -4 && p.y >= w.top - 4, "sticker " + i + " sits on the letters, not under the cut")
    assert.ok(p.size > 6 && p.size < 9, "a sticker is about an x-height")
    assert.ok(Math.abs(p.rotate) <= 17 && p.depth > 0)
    if (i) assert.ok(p.x - s[i - 1].x > 4, "stickers don't stack")
  }
  assert.deepEqual(T.stickerSpots(w, 0), [])
  assert.deepEqual(T.stickerSpots(T.layoutScript(""), 4), [], "no word, no stickers")
  assert.deepEqual(T.stickerSpots(w, NaN), [])
  const star = T.starPath(13, 54, 39, 60, 60, 0.2, 4)
  assert.match(star, /^M.*Z$/)
  assert.equal(star.split("L").length, 26)
  assert.equal(T.clamp(NaN, 1, 5), 1)
  assert.equal(T.clamp(9, 1, 5), 5)
}

// ---- install safety ------------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import")
assert.doesNotMatch(code, /["+]\s*(\*|body|:root|html)\s*{/, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks")
assert.doesNotMatch(code, /\$\{/, "no template interpolation")
assert.doesNotMatch(code, /https?:\/\//, "nothing is fetched")
assert.doesNotMatch(code, /innerWidth|innerHeight|scrollY/, "size from the element, not the window")
assert.doesNotMatch(code, /\bh-(full|screen)\b/, "no percentage-height classes")
assert.doesNotMatch(code, /localStorage|sessionStorage/, "no storage")

const css = src.slice(src.indexOf("const CSS ="), src.indexOf("const useStrokeLengths"))
for (const m of css.matchAll(/"([^"]*)\{/g)) {
  const sel = m[1].replace(/^.*\}/, "")
  if (!sel || sel.startsWith("@")) continue
  for (const part of sel.split(",")) {
    assert.ok(/^(\.ssf|:where\(\.ssf\)|from|to|\d+%)/.test(part.trim()), "unscoped CSS rule: " + part)
  }
}
assert.ok(css.includes(":where(.ssf) button{"), "buttons are reset at zero specificity")
assert.ok(css.includes(".ssf svg{display:block;max-width:none"), "svgs opt out of Preflight's max-width")

// The draw-in: --l carries px, so calc(var(--l) + 8px) stays valid.
assert.ok(src.includes('Math.ceil(p.getTotalLength()) + 1 + "px"'), "--l is a length")
assert.doesNotMatch(css, /var\(--l,\d+\)/, "fallbacks are lengths too")

// Height is a definite prop, applied as a minimum.
assert.ok(src.includes('height = "100svh"'), "definite default height")
assert.ok(src.includes("minHeight: height"))
assert.ok(css.includes("container-type:inline-size"), "sizes come from the component's own width")
assert.ok(css.includes("overflow:hidden;overflow:clip;"), "the root clips instead of scrolling")
assert.ok(css.includes("@container (max-width: 760px)"), "columns stack when narrow")

// Motion: the finished state is the default; motion only adds the way in.
const motion = css.indexOf("@media (prefers-reduced-motion: no-preference){")
assert.ok(motion > -1, "the storyboard is opt-in to motion")
assert.ok(css.indexOf("ssf:not(.is-in)") > motion, "nothing is hidden outside the motion block")
assert.ok(src.includes('window.matchMedia?.("(prefers-reduced-motion: reduce)")'), "scripted wiggles respect it too")
assert.ok(src.includes("io.disconnect()"), "the observer is cleaned up")
assert.ok(src.includes("cancelAnimationFrame(raf)"), "the scroll frame is cleaned up")
assert.ok(src.includes('removeEventListener("scroll", onScroll, { capture: true })'), "the scroll listener is removed")
assert.ok(src.includes("clearTimeout(id)"), "the copied timer is cleaned up")

// Accessibility.
assert.ok(src.includes('role="status"'), "copying is announced")
assert.ok(src.includes("aria-expanded={open}"), "the credits toggle says whether it is open")
assert.ok(src.includes('if (e.key === "Escape") setOpen(false)'), "Escape closes the credits")
assert.ok(src.includes("ArrowLeft: [-step, 0]"), "stickers move from the keyboard")
assert.ok(src.includes('aria-label={"Write " + wordmark + " again"}'), "the wordmark is a labelled button")
assert.ok(src.includes('if (!href || href === "#") e.preventDefault()'), "# links leave the page hash alone")
assert.ok(src.includes('window.location.href = "mailto:" + email'), "no clipboard falls back to mail")

// Demos import the installed path.
for (const f of ["demo.tsx", "demo-scroll.tsx"]) {
  assert.ok(read(f).includes('from "@/components/ui/sticker-slap-footer"'), f + " imports the installed path")
}

console.log("sticker-slap-footer: ok")
