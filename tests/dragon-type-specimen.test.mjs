// Runnable checks for components/dragon-type-specimen: the typeface, the page
// clock, the dragon's paths, plus the install-safety rules the .tsx has to keep.
// Run: node tests/dragon-type-specimen.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/dragon-type-specimen/", import.meta.url)
const src = readFileSync(new URL("dragon-type-specimen.tsx", dir), "utf8")
const start = src.indexOf("// #region specimen")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "specimen region markers missing")
const m = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- the typeface --------------------------------------------------------------
{
  const need = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.:!?/ "
  for (const ch of need) assert.ok(m.GLYPHS[ch], `glyph ${JSON.stringify(ch)} is missing`)
  for (const [ch] of Object.entries(m.GLYPHS)) {
    if (ch === " ") continue
    for (const w of [7, m.WEIGHTS.regular, m.WEIGHTS.bold, 20]) {
      const g = m.glyphPolys(ch, w)
      assert.ok(g.polys.length > 0, `${ch} draws nothing at weight ${w}`)
      for (const p of g.polys) for (const [x, y] of p) assert.ok(Number.isFinite(x) && Number.isFinite(y), `${ch} has a NaN point`)
      // every glyph stays near its box: slabs and thorns may overhang a little, no further
      const xs = g.polys.flat().map((q) => q[0])
      const ys = g.polys.flat().map((q) => q[1])
      assert.ok(Math.min(...xs) > -30 && Math.max(...xs) < g.w + 30, `${ch} spills sideways`)
      assert.ok(Math.min(...ys) > -40 && Math.max(...ys) < 140, `${ch} spills vertically`)
    }
  }
  // holes wind against fills, so one nonzero path keeps counters open
  const area = (p) => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2
  const o = m.glyphPolys("O").polys.map(area)
  assert.ok(o.some((a) => a > 0) && o.some((a) => a < 0), "O keeps its counter")
  assert.ok(m.glyphPolys("A").polys.every((p) => area(p) > 0), "open strokes all wind the fill way")
  // bold is heavier than regular, the alternate adds a thorned bar
  assert.ok(m.glyphPath("H", m.WEIGHTS.bold).d !== m.glyphPath("H").d)
  assert.ok(m.glyphPolys("H", 11, true).polys.length > m.glyphPolys("H").polys.length, "alternates add the pierce")
  // layout: advances add up, unknown characters become spaces, case folds
  const w = m.layoutWord("AB")
  assert.equal(w.width, m.GLYPHS.A[0] + m.SIDEBEARING + m.GLYPHS.B[0])
  assert.equal(m.layoutWord("ab").width, w.width)
  assert.equal(m.layoutWord("A~B").glyphs.length, 3)
  assert.equal(m.layoutWord("").width, 0)
}

// ---- the book: seven pages over one scroll ----------------------------------------
{
  assert.equal(m.CHAPTERS.length, 7)
  assert.deepEqual(m.chapterAt(0), { i: 0, t: 0 })
  assert.equal(m.chapterAt(1).i, 6, "the end of the scroll is the last page, not an eighth")
  assert.equal(m.chapterAt(0.5).i, 3)
  assert.equal(m.chapterVis(0, 0), 1, "the cover is up before any scroll")
  assert.equal(m.chapterVis(6, 1), 1, "the last page stays")
  for (let i = 1; i < 6; i++) {
    assert.equal(m.chapterVis(i, -0.2), 0)
    assert.equal(m.chapterVis(i, 0.5), 1)
    assert.equal(m.chapterVis(i, 1.2), 0)
  }
  // neighbouring pages never sit fully on top of each other
  for (let p = 0; p <= 1; p += 0.002) {
    const v = m.CHAPTERS.map((_, i) => m.chapterVis(i, m.localT(p, i)))
    assert.ok(v.filter((x) => x > 0.5).length <= 1, `two pages fully shown at p=${p.toFixed(3)}`)
  }
  assert.equal(m.scrollProgress(0, 2000, 800), 0)
  assert.equal(m.scrollProgress(-600, 2000, 800), 0.5)
  assert.equal(m.scrollProgress(-5000, 2000, 800), 1, "clamped")
  assert.equal(m.scrollProgress(0, 800, 800), 1, "no scroll range: treat as done")
}

// ---- the dragon: one path per page, in from off-page, out to off-page ----------------
{
  const pages = m.SCENES.map((s) => s.chapter)
  assert.deepEqual(pages, [0, 2, 3, 4, 5, 6], "every page but the eye has the dragon")
  const offPage = ([x, y], pad) => x < -pad || x > m.SCENE_W + pad || y < -pad || y > m.SCENE_H + pad
  for (const s of m.SCENES) {
    const tr = m.makeTrack(s)
    const first = s.chapter === 0
    const last = s.chapter === 6
    if (!first) assert.ok(offPage(s.pts[0], 150), `page ${s.chapter}: path starts off the page`)
    if (!last) assert.ok(offPage(s.pts.at(-1), 150), `page ${s.chapter}: path ends off the page`)
    // the head rests on the page
    const [hx, hy] = m.trackAt(tr, tr.restArc)
    assert.ok(hx > 0 && hx < m.SCENE_W && hy > 0 && hy < m.SCENE_H, `page ${s.chapter}: head rests on the page`)
    // it arrives, rests, leaves; never backs up while you scroll forward
    let prev = -Infinity
    for (let t = 0; t <= 1; t += 0.005) {
      const a = m.headArc(tr, t, first, last)
      assert.ok(a >= prev - 1e-9, `page ${s.chapter}: head backs up at t=${t}`)
      prev = a
    }
    if (!first) {
      // at the page break the whole body is off the page: no second dragon pops in
      const a = m.headArc(tr, 0, first, last)
      for (let j = 0; j <= 40; j++) assert.ok(offPage(m.trackAt(tr, a - (j / 40) * m.BODY_LEN), 150), `page ${s.chapter}: body visible on arrival`)
    }
    if (!last) {
      const a = m.headArc(tr, 1, first, last)
      for (let j = 0; j <= 40; j++) assert.ok(offPage(m.trackAt(tr, a - (j / 40) * m.BODY_LEN), 150), `page ${s.chapter}: body still visible at exit`)
    }
    // depth, where given, runs alongside the path point for point
    if (s.z) {
      assert.equal(s.z.length, s.pts.length, `page ${s.chapter}: one depth per path point`)
      assert.equal(m.trackAt(tr, tr.restArc)[4], s.z[s.rest], `page ${s.chapter}: depth follows the path`)
    }
    // tangents are unit vectors, past the ends too
    for (const a of [-500, 0, tr.len / 2, tr.len + 500]) {
      const [, , tx, ty] = m.trackAt(tr, a)
      assert.ok(Math.abs(Math.hypot(tx, ty) - 1) < 1e-6)
    }
  }
  assert.ok(m.bodyRadius(0.2) > m.bodyRadius(0) && m.bodyRadius(0.2) > m.bodyRadius(0.95), "neck and tail are thinner than the chest")
  assert.ok(m.bodyRadius(1) > 0, "the tail tip keeps a width")
}

// ---- the legs: a two-bone reach, and legs that can reach where they are sent -------------
{
  const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
  const S = [10, -20, 5]
  for (const [W, a, b, pole] of [
    [[300, 200, -40], 250, 230, [0, -1, 0]],
    [[40, 380, 90], 300, 200, [1, 0, 0.3]],
    [[20, -10, 5], 120, 110, [0, 0, 1]], // almost folded shut
    [[900, 0, 0], 200, 200, [0, 1, 0]], // out of reach
    [[0, 300, 0], 150, 170, [0, 1, 0]], // pole along the reach: any side
  ]) {
    const E = m.ik2(S, W, a, b, pole)
    assert.ok(E.every(Number.isFinite), "ik2 gives a point")
    assert.ok(Math.abs(len(S, E) - a) < 1e-6, "the upper bone keeps its length")
    const d = len(S, W)
    const wrist = E.map((v, c) => v + ((W[c] - v) / len(E, W)) * b)
    assert.ok(Math.abs(len(E, wrist) - b) < 1e-9, "the lower bone keeps its length")
    if (d < a + b - 0.01 && d > Math.abs(a - b) + 0.01) assert.ok(Math.abs(len(E, W) - b) < 1e-6, "in reach, the wrist lands on the target")
    else assert.ok(len(wrist, W) < d, "out of reach, it still points at the target")
  }
  // the elbow bends toward the pole
  const E = m.ik2([0, 0, 0], [0, 300, 0], 200, 200, [1, 0, 0])
  assert.ok(E[0] > 100, "the elbow goes the pole's way")
  for (const s of m.SCENES)
    for (const L of s.legs ?? []) {
      assert.ok(L.u >= 0.06 && L.u <= 1, `page ${s.chapter}: a leg grows from the body, clear of the neck`)
      assert.ok(Math.hypot(...L.at) < 1, `page ${s.chapter}: a leg's root sits inside the body`)
      assert.ok(L.len[0] > 0 && L.len[1] > 0 && L.curl >= 0 && L.curl <= 1.2)
    }
  assert.ok(m.SCENES.find((s) => s.chapter === 0).legs.length === 3, "three legs on the cover")
  assert.ok(m.SCENES.filter((s) => s.legs?.some((l) => l.front)).length >= 2, "hands grip the type on the cover and the weights page")
}

// ---- colours ---------------------------------------------------------------------
assert.deepEqual(m.parseHex("#fff"), [255, 255, 255])
assert.deepEqual(m.parseHex("#e3160f"), [227, 22, 15])
assert.equal(m.parseHex("red"), null)
assert.equal(m.mixColor("#000000", "#ffffff", 0.5), "rgb(128,128,128)")
assert.equal(m.mixColor("red", "#000", 0.2), "red", "non-hex falls back instead of breaking")

// ---- install safety -------------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((x) => x[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import|<img\b|fetch\(|new Image\(|url\(["']?http/, "nothing loads at runtime: the dragon and the face are drawn")
assert.ok(!src.includes("$" + "{"), "no template interpolation, so no ${ can reach a style string")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(/height = "100svh"/.test(src), "stage height defaults to a definite length")
const root = src.slice(src.indexOf("<section"), src.indexOf("<canvas"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root or stage")
assert.ok(/overflow: "clip"/.test(src), "root clips without becoming a scroll container, or sticky breaks")
assert.ok(/className="sticky top-0/.test(src), "the stage pins while the book plays")
assert.equal((src.match(/maxWidth: "none"/g) || []).length, 4, "Preflight's max-width is overridden on both svgs and both canvases")
assert.ok(/ref=\{frontRef\}[\s\S]{0,200}pointerEvents: "none"/.test(src), "the canvas above the type lets the pointer through")
assert.ok(src.includes("prefers-reduced-motion") && /c\.reduced/.test(src), "reduced motion takes its own path")
assert.ok(src.includes("motion-reduce:"), "css animations have a reduced-motion variant")
assert.ok(src.includes("aria-label") && src.includes('role="button"') && src.includes("onKeyDown"), "the style picker is reachable by keyboard")
for (const gone of ["cancelAnimationFrame(raf)", "io.disconnect()", "ro.disconnect()"]) assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
assert.ok(/React\.useId\(\)/.test(src), "svg ids must be unique so two instances do not share filters")

for (const name of ["demo.tsx", "demo-custom.tsx", "demo-pages.tsx"]) {
  const demo = readFileSync(new URL(name, dir), "utf8")
  assert.ok(/className="w-full"/.test(demo), `${name}: wrapper must be w-full`)
  assert.ok(demo.includes('from "@/components/ui/dragon-type-specimen"'), `${name}: imports the installed path`)
}

console.log("dragon-type-specimen: ok")
