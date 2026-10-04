// Runnable check for components/kiln-wordmark-footer: the procedural alphabet,
// the layout, the weight lens and the tile, plus the install-safety rules.
// Run: node tests/kiln-wordmark-footer.test.mjs
//
// What breaks silently here: a glyph whose counter is wound the same way as
// its outline (the "o" fills solid), a letter whose advance changes with its
// weight (the word shimmies sideways under the pointer), a clipped terminal
// that leaves a hairline sliver, and a tile that can't get back to the first
// composition.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/kiln-wordmark-footer/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("kiln-wordmark-footer.tsx")

const start = src.indexOf("// #region kiln")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "kiln region markers missing")
const K = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// Winding number of a point against every subpath (nonzero fill rule).
const winding = (polys, [px, py]) => {
  let w = 0
  for (const p of polys) {
    for (let i = 0; i < p.length; i++) {
      const [ax, ay] = p[i]
      const [bx, by] = p[(i + 1) % p.length]
      const cross = (bx - ax) * (py - ay) - (px - ax) * (by - ay)
      if (ay <= py && by > py && cross > 0) w++
      else if (ay > py && by <= py && cross < 0) w--
    }
  }
  return w
}
const filled = (polys, pt) => winding(polys, pt) !== 0
const shapes = (ch, k = 1) => {
  const { V, h } = K.strokes(k)
  return K.GLYPHS[ch][1](V, h)
}

// ---- winding: outlines one way, counters the other -------------------------
{
  const o = shapes("o")
  assert.equal(o.length, 2)
  assert.ok(K.signedArea(o[0]) > 0 && K.signedArea(o[1]) < 0, "the counter winds against the outline")
  assert.ok(!filled(o, [56, 50]), "the o has a hole")
  assert.ok(filled(o, [8, 50]) && filled(o, [104, 50]), "and two sides")
  assert.ok(filled(o, [56, 5]) && filled(o, [56, 95]), "and a top and bottom")
  assert.ok(!filled(o, [1, 1]), "the corner is rounded off")

  const a = shapes("a")
  assert.ok(filled(a, [100, 3]), "the a's stem squares off the top-right corner")
  assert.ok(!filled(a, [56, 50]), "and keeps its counter")
  assert.ok(!filled(shapes("d"), [56, 50]) && filled(shapes("d"), [100, -30]), "d has a counter and an ascender")
  assert.ok(filled(shapes("p"), [10, 130]) && filled(shapes("q"), [104, 130]), "p and q descend")

  // open letters: the counter opens to the right
  assert.ok(!filled(shapes("c"), [80, 50]), "c is open")
  assert.ok(filled(shapes("c"), [6, 50]), "but has a spine")
  const e = shapes("e")
  assert.ok(filled(e, [100, 30]), "e is closed above the bar")
  assert.ok(filled(e, [70, 50]), "has a bar")
  assert.ok(!filled(e, [100, 72]), "and opens below it")
  const n = shapes("n")
  assert.ok(!filled(n, [56, 90]), "n is open at the bottom")
  assert.ok(filled(n, [56, 4]), "and arched on top")
  const u = shapes("u")
  assert.ok(!filled(u, [56, 10]) && filled(u, [56, 96]), "u is n upside down")
  const s = shapes("s")
  assert.ok(filled(s, [52, 50]), "s has a spine through the middle")
  assert.ok(!filled(s, [100, 32]) && !filled(s, [4, 70]), "and its two apertures")
}

// ---- every glyph is well formed, at every weight ----------------------------
{
  for (const ch of Object.keys(K.GLYPHS)) {
    for (const k of [0.4, 0.7, 1, 1.3, 1.6]) {
      const polys = shapes(ch, k)
      for (const p of polys) {
        assert.ok(p.length >= 3, ch + " has a degenerate subpath")
        for (const [x, y] of p) assert.ok(Number.isFinite(x) && Number.isFinite(y), ch + " has a NaN point")
        // No hairline slivers: a clipped piece is either real ink or gone.
        assert.ok(Math.abs(K.signedArea(p)) > 4, ch + " leaves a sliver at k=" + k)
      }
      const d = K.glyphPath(ch, k, 10)
      if (ch === " ") assert.equal(d, "")
      else assert.match(d, /^(M[\d.\- ]+(L[\d.\- ]+)+Z)+$/, ch + " path is malformed")
    }
  }
  for (const ch of "abcdefghijklmnopqrstuvwxyz") assert.ok(ch in K.GLYPHS, "missing glyph " + ch)
  assert.equal(K.glyphPath("?", 1), "", "unknown characters draw nothing")
}

// ---- weight changes the ink, never the advance ------------------------------
{
  const inkArea = (ch, k) => shapes(ch, k).reduce((a, p) => a + K.signedArea(p), 0)
  for (const ch of "aeonrstv") {
    assert.ok(inkArea(ch, 1.4) > inkArea(ch, 1), ch + " gets heavier")
    assert.ok(inkArea(ch, 0.7) < inkArea(ch, 1), ch + " gets lighter")
  }
  // The outline of an edge-anchored letter stays inside its advance at any weight.
  for (const ch of "abcdeghmnopqrsuvwxz") {
    const w = K.GLYPHS[ch][0]
    for (const k of [0.5, 1, 1.6]) {
      for (const p of shapes(ch, k)) for (const [x] of p) assert.ok(x > -0.5 && x < w + 0.5, ch + " spills out of its advance at k=" + k)
    }
  }
  const { V, h } = K.strokes(1)
  assert.equal(V, 30)
  assert.ok(Math.abs(h - 19) < 1e-9)
  assert.deepEqual(K.strokes(NaN), K.strokes(1), "a bad weight is the reference weight")
  assert.deepEqual(K.strokes(99), K.strokes(1.6), "weights are clamped")
}

// ---- layout ------------------------------------------------------------------
{
  const L = K.layoutWord("corvena", 10)
  assert.equal(L.letters.length, 7)
  assert.equal(L.top, 0, "no ascenders, no headroom")
  assert.equal(L.bottom, K.XH, "no descenders, no footroom")
  for (let i = 1; i < L.letters.length; i++) {
    const p = L.letters[i - 1]
    assert.equal(L.letters[i].x, p.x + p.w + 10, "letters sit one advance + tracking apart")
  }
  const last = L.letters.at(-1)
  assert.equal(L.width, last.x + last.w, "no trailing tracking")
  assert.equal(K.layoutWord("tessuto").top, -K.ASC, "t opens the ascender")
  assert.equal(K.layoutWord("pgy").bottom, K.XH + K.DESC, "descenders open the foot")
  assert.deepEqual(K.layoutWord(""), { letters: [], width: 0, top: 0, bottom: K.XH })
  assert.equal(K.supported("corvena"), true)
  assert.equal(K.supported("a-b.c d"), true)
  assert.equal(K.supported("café"), false, "anything undrawable falls back to text")
  assert.equal(K.supported(""), false)
}

// ---- the weight lens ---------------------------------------------------------
{
  const c = [50, 200, 400, 800]
  assert.deepEqual(K.lensWeights(c, null, 1, 0.4, 150), [1, 1, 1, 1], "pointer away: every letter rests")
  const w = K.lensWeights(c, 200, 1, 0.4, 150)
  assert.ok(Math.abs(w[1] - 1.4) < 1e-12, "the letter under the pointer gets the whole boost")
  assert.ok(w[0] > w[2] && w[2] > w[3], "and it falls off with distance")
  assert.ok(w[3] - 1 < 1e-4, "far letters are untouched")
  assert.deepEqual(K.lensWeights(c, NaN, 1, 0.4, 150), [1, 1, 1, 1])
  assert.deepEqual(K.lensWeights(c, 10, 1, 0.4, 0), [1, 1, 1, 1], "a zero radius is no lens, not NaN")

  assert.equal(K.approach(0, 1, 1, 1 / 60), 1, "k=1 snaps")
  assert.equal(K.approach(0, 1, 0, 1 / 60), 0, "k=0 never moves")
  const a = K.approach(0, 1, 0.2, 1 / 60)
  const b = K.approach(K.approach(0, 1, 0.2, 1 / 120), 1, 0.2, 1 / 120)
  assert.ok(Math.abs(a - b) < 1e-12, "frame-rate independent")
  assert.equal(K.approach(0, 1, 0.2, 5), K.approach(0, 1, 0.2, 0.1), "a stalled tab doesn't teleport")
}

// ---- the tile ----------------------------------------------------------------
{
  assert.ok(K.TILES.length >= 3)
  let i = 0
  const seen = new Set()
  for (let n = 0; n < K.TILES.length; n++) seen.add((i = K.nextTile(i)))
  assert.equal(seen.size, K.TILES.length, "turning visits every composition")
  assert.equal(i, 0, "and comes back to the first")
  assert.equal(K.nextTile(-1), 0)
  assert.equal(K.nextTile(NaN), 1)
  assert.equal(K.nextTile(3, 0), 0)
  // The first tile matches the reference: a disc left of centre, a slab on the right.
  const t = K.TILES[0]
  assert.ok(t.cx < 0.5 && t.sx > 0.7 && t.sx + t.sw === 1)
  const lean = K.leanTile(t, 1, -1)
  assert.ok(lean.cx > t.cx && lean.cy < t.cy, "the disc leans toward the pointer")
  assert.equal(lean.r, t.r, "without growing")
  assert.deepEqual(K.leanTile(t, NaN, 0), t)
  assert.deepEqual(K.leanTile(t, 9, 0), K.leanTile(t, 1, 0), "lean is clamped")
}

// ---- half-plane clipping -----------------------------------------------------
{
  const sq = K.rect(0, 0, 10, 10)
  const left = K.clipHalf(sq, [0, 4, 1])
  assert.ok(Math.abs(K.signedArea(left) - 40) < 1e-9, "keeps x <= 4")
  const right = K.clipHalf(sq, [0, 4, -1])
  assert.ok(Math.abs(K.signedArea(right) - 60) < 1e-9, "keeps x >= 4")
  assert.deepEqual(K.keep([sq], [0, -1, 1]), [], "clipping everything leaves nothing")
  const hole = K.orient(K.rect(2, 2, 8, 8), -1)
  const kept = K.keep([sq, hole], [1, 5, 1])
  assert.ok(K.signedArea(kept[0]) > 0 && K.signedArea(kept[1]) < 0, "clipping preserves winding")
}

// ---- install safety ----------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /["+]\s*(\*|body|:root|html)\s*{/, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks — CSS is built by concatenation")
assert.doesNotMatch(code, /\$\{/, "no template interpolation")
assert.doesNotMatch(code, /https?:\/\/(?!www\.w3\.org)/, "nothing is fetched")
assert.doesNotMatch(code, /innerWidth|innerHeight|scrollY/, "size from the element, not the window")
assert.doesNotMatch(code, /\bh-(full|screen)\b/, "no percentage-height classes")
assert.doesNotMatch(code, /localStorage|sessionStorage/, "no storage")

const css = src.slice(src.indexOf("const CSS ="), src.indexOf("const BOOST"))
for (const m of css.matchAll(/"([^"]*)\{/g)) {
  const sel = m[1].replace(/^.*\}/, "")
  if (!sel || sel.startsWith("@")) continue
  assert.ok(/^(\.kwf|:where\(\.kwf\)|from|to|\d+%)/.test(sel.trim()), "unscoped CSS rule: " + sel)
}
assert.ok(!/"\.kwf (a|button)\{/.test(css), "element resets go through :where(.kwf)")
assert.ok(css.includes(":where(.kwf) button{"), "buttons are reset at zero specificity")

// Intrinsic height: the root sizes from its content, the wordmark from its viewBox.
assert.ok(css.includes("container-type:inline-size"), "the root is a size container")
assert.ok(/cqw/.test(css), "sizes scale with the component, not the viewport")
assert.ok(src.includes("@container (max-width: 720px)"), "stacks when narrow")
assert.ok(css.includes(".kwf-word{display:block;width:100%;height:auto;max-width:none"), "the wordmark takes its height from its viewBox")
assert.ok((css.match(/max-width:none/g) || []).length >= 3, "svgs opt out of Preflight's max-width")
assert.doesNotMatch(src.slice(src.indexOf('".kwf{'), src.indexOf('":where(.kwf) a{')), /height:100%/, "the root has no percentage height")

// Motion.
assert.ok(css.includes("@media (prefers-reduced-motion: reduce){"), "CSS motion stops")
assert.ok(src.includes('matchMedia("(prefers-reduced-motion: reduce)")'), "the loop reads it too")
assert.ok(src.includes("const snap = a.reduced"), "and snaps instead of easing")
assert.ok(src.includes("new IntersectionObserver"), "the reveal waits until it's seen")
assert.ok(src.includes("a.raf = busy ? requestAnimationFrame(step) : 0"), "the loop sleeps when settled")

// Cleanup.
for (const gone of ["io?.disconnect()", "ro.disconnect()", "cancelAnimationFrame(a.raf)", 'removeEventListener("change", onMq)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}

// Accessibility.
assert.ok(src.includes('aria-label="Back to top"'))
assert.ok(src.includes('<p className="sr-only">{word}</p>'), "the wordmark exists as text")
assert.ok(src.includes("touch-action:pan-y"), "the page still scrolls over the wordmark on touch")
assert.ok(src.includes('if (!href || href === "#") e.preventDefault()'), "'#' links don't touch the hash")
assert.ok(src.includes('closest("a,button,.kwf-word")'), "clicking a link never turns the tile")

// Defaults match the reference: four navigation columns, two social columns.
assert.equal((src.match(/const DEFAULT_NAV[\s\S]*?\n\]/)[0].match(/^  \[/gm) || []).length, 4)
assert.equal((src.match(/const DEFAULT_SOCIALS[\s\S]*?\n\]/)[0].match(/^  \[/gm) || []).length, 2)

// A demo wrapper left at width:auto collapses inside 21st's centring flex.
for (const f of ["demo.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/kiln-wordmark-footer"'), f + " imports the installer path")
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), f + ": " + cls + " has no width")
}

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/kiln-wordmark-footer": ["./components/kiln-wordmark-footer/kiln-wordmark-footer.tsx"]'), "tsconfig path missing")

console.log("kiln-wordmark-footer: ok")
