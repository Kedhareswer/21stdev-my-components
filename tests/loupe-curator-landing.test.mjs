// Runnable check for components/loupe-curator-landing: the scroll → story mapping
// (word-gap zooms, the collections drum, the pile, reduced-motion poses, the easter egg)
// and the install-safety rules.
// Run: node tests/loupe-curator-landing.test.mjs
//
// What breaks silently here is timing: a curator scene still animating when the next
// panel slides over it, a zoom that never quite covers the stage, or a drum that never
// lands its last name dead centre.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "loupe-curator-landing"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 900_000, "photos stay compressed: " + statSync(file).size)

// every picture slot has an embedded photo (no broken <img> after an edit to the lists)
const imgKeys = new Set([...src.matchAll(/^  "((?:curator|scene|tile)-[A-Za-z0-9]+)": "data:image\/webp;base64,/gm)].map((m) => m[1]))
const kinds = new Set([...src.matchAll(/\[\s*"([a-zA-Z]+)",\s*(?:-?\d|")/g)].map((m) => m[1]))
for (const k of ["bowl", "shades", "book", "lamp", "chair", "vase", "citrus", "camera", "figA", "figB", "sneaker", "hoodie", "beanie", "record", "kettle", "tote"]) assert.ok(imgKeys.has("tile-" + k), "tile photo: " + k)
for (let i = 0; i < 3; i++) assert.ok(imgKeys.has("curator-" + i), "curator photo " + i)
for (let i = 0; i < 6; i++) assert.ok(imgKeys.has("scene-" + i), "scene photo " + i)
assert.ok(kinds.size > 0)
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
const templates = JSON.parse(readFileSync(new URL("../scripts/templates.json", import.meta.url), "utf8"))
assert.ok(templates.templates.some((t) => t.slug === slug), "listed as a template")
assert.match(demo, /from "@\/components\/ui\/loupe-curator-landing"/, "demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /var\(--color-/, "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, [], "fetches nothing: every picture is drawn in code, fonts are embedded")
assert.equal((src.match(/@font-face\{font-family:Lcl(Sans|Mono)/g) || []).length, 3, "three embedded, renamed font subsets")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /\(hover: hover\) and \(pointer: fine\)/, "fine-pointer gate is read at runtime")
assert.match(src, /ev\.pointerType !== "mouse"/, "touch never drives the cursor, magnets or the pile")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("/* ---", cssAt)).replace(/"\s*\+\s*\n\s*(\/\*[^*]*\*\/\s*\n\s*)?"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{\.lcl-cursor\{display:block\}/, "the cursor only exists where a mouse can hover")
assert.match(css, /\.lcl-cursor\{display:none/, "and is hidden everywhere else")
assert.match(css, /\.lcl-root svg,\.lcl-root img\{max-width:none\}/, "guards Preflight's img/svg max-width")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((x) => /^(\.dark )?\.lcl-/.test(x.trim())),
    "unscoped selector: " + sel,
  )
}
assert.ok(rules >= 80, "the scope check saw real rules, saw " + rules)

// layout reads: one per frame (the root's top); everything else on measure, click or pointer-enter
const loopAt = src.indexOf("const frame = (now: number) =>")
const loop = src.slice(loopAt, src.indexOf("const schedule = ()", loopAt))
assert.equal((loop.match(/getBoundingClientRect/g) || []).length, 1, "the frame reads layout exactly once")
assert.doesNotMatch(loop, /offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle/, "and nothing else")
assert.equal((src.match(/getBoundingClientRect/g) || []).length, 3, "frame, click-jumps, magnet enter")

// ---- the story -----------------------------------------------------------
const S = await liftRegion(src, "story")

assert.equal(S.progressFrom(0, 5000, 1000), 0)
assert.equal(S.progressFrom(-4000, 5000, 1000), 1)
assert.equal(S.progressFrom(300, 5000, 1000), 0, "before it arrives")
assert.equal(S.progressFrom(-10, 800, 1000), 0, "no travel, no progress, never NaN")

// every pinned story finishes before the next panel slides over it
const last = (beats) => Math.max(...Object.values(beats).map((w) => w[1]))
assert.ok(last(S.INTRO) <= S.coverAt(S.TRACK.intro), "intro is still before the manifesto covers it")
assert.ok(last(S.ZOOM) <= S.coverAt(S.TRACK.zoom), "the drum lands before the pile covers it")
for (const beats of [S.INTRO, S.ZOOM, S.PILE]) for (const [k, w] of Object.entries(beats)) assert.ok(w[0] < w[1], k + " has a forward window")
assert.ok(S.INTRO.open[1] <= S.INTRO.grow[0], "the gap opens fully before it grows")
assert.ok(S.INTRO.caption[0] >= S.INTRO.grow[0], "the caption only types over a growing photo")
assert.ok(S.INTRO.captionOut[1] <= S.INTRO.callouts[1], "callouts land after the caption leaves")

// the zoom box: nothing → a word-sized gap → the whole stage, centred, monotone
{
  const W = 1280, H = 740, w0 = 179, h0 = 111
  const shut = S.zoomBox(0, 0, W, H, w0, h0)
  assert.equal(shut.w, 0, "shut before it opens")
  const gap = S.zoomBox(1, 0, W, H, w0, h0)
  assert.deepEqual([gap.w, gap.h], [w0, h0], "opens to exactly the gap")
  const full = S.zoomBox(1, 1, W, H, w0, h0)
  assert.deepEqual([full.x, full.y, full.w, full.h, full.r], [0, 0, W, H, 0], "ends covering the stage, square-cornered")
  assert.equal(S.insetOf(full, W, H), "inset(0.0px 0.0px 0.0px 0.0px round 0.0px)")
  let prev = S.zoomBox(1, 0, W, H, w0, h0)
  for (let g = 0.01; g <= 1.0001; g += 0.01) {
    const b = S.zoomBox(1, g, W, H, w0, h0)
    assert.ok(b.w >= prev.w - 1e-9 && b.h >= prev.h - 1e-9, "never shrinks while growing")
    assert.ok(Math.abs(b.x * 2 + b.w - W) < 1e-6 && Math.abs(b.y * 2 + b.h - H) < 1e-6, "stays centred on the gap")
    const k = S.coverScale(b, W, H)
    assert.ok(W * k >= b.w - 1e-6 && H * k >= b.h - 1e-6, "the shrunk picture always covers its box")
    prev = b
  }
  assert.equal(S.coverScale(full, W, H), 1, "full size once it covers the stage")
  assert.doesNotMatch(S.insetOf(S.zoomBox(0.3, 0.2, W, H, w0, h0), W, H), /NaN|-/, "no NaN, no negative insets")
}

// the face flicker only runs while the gap opens
assert.equal(S.flipAt(0, 3), -1)
assert.equal(S.flipAt(S.INTRO.grow[1], 3), -1, "settled once the photo grows")
{
  const seen = new Set()
  for (let p = S.INTRO.flip[0] + 0.001; p < S.INTRO.flip[1]; p += 0.001) seen.add(S.flipAt(p, 3))
  assert.deepEqual([...seen].sort(), [0, 1, 2], "flicks through every face")
}

// the drum: starts on the first name, ends dead centre on the last, never runs backwards, holds on each
{
  const n = 6
  assert.equal(S.drumAt(0, n), 0)
  assert.equal(S.drumAt(1, n), n - 1)
  let prev = 0
  for (let p = 0; p <= 1.0001; p += 0.0005) {
    const a = S.drumAt(p, n)
    assert.ok(a >= prev - 1e-12, "the drum never turns back at p=" + p.toFixed(4))
    prev = a
  }
  for (let i = 0; i < n; i++) {
    assert.equal(S.drumAt(S.drumHold(i, n), n), i, "collection " + i + " jumps dead centre")
    if (i < n - 1) {
      const step = (S.ZOOM.drum[1] - S.ZOOM.drum[0]) / (n - 1)
      assert.equal(S.drumAt(S.drumHold(i, n) + step * 0.15, n), i, "and holds there for a moment")
    }
  }
  assert.equal(S.drumAt(0.5, 1), 0, "one collection: no drum, no NaN")
}

// giant words: every word passes the centre line once, and arrives settled
{
  const H = 800
  const passes = [0, 1, 2].map(() => 0)
  let prev = S.wordsAt(0, 1, H, 3)
  for (let p = 0.001; p <= 1.0001; p += 0.001) {
    const w = S.wordsAt(p, 1, H, 3)
    assert.ok(w.col < prev.col, "the column only rises")
    w.e.forEach((e, k) => {
      assert.ok(e >= 0 && e <= 1)
      const y0 = prev.col + k * S.WORDS.gap * H
      const y1 = w.col + k * S.WORDS.gap * H
      if (y0 >= H / 2 && y1 < H / 2) {
        passes[k]++
        assert.equal(e, 0, "word " + k + " is settled as it crosses the middle")
      }
    })
    prev = w
  }
  assert.deepEqual(passes, [1, 1, 1], "each word crosses the centre exactly once")
  assert.ok(S.wordsAt(1, 1, H, 3).band < 0, "the lime band has left by the end")
  assert.ok(Math.abs(S.wordsAt(0, 1, H, 3).band - S.wordsAt(0.0001, 1, H, 3).band) < 1, "no jump in the band when the stage pins")
}

// the pile: empty, then one tile at a time, then all; a reseed reshuffles deterministically
{
  const n = 14
  assert.equal(S.pileCount(0, n), 0)
  assert.equal(S.pileCount(1, n), n)
  let prev = 0
  for (let p = 0; p <= 1.0001; p += 0.001) {
    const c = S.pileCount(p, n)
    assert.ok(c >= prev && c - prev <= 1, "tiles drop one at a time")
    prev = c
  }
  assert.deepEqual(S.pileSpot(3, 1), S.pileSpot(3, 1), "seeded: same pile every render")
  assert.notDeepEqual(S.pileSpot(3, 1), S.pileSpot(3, 2), "a shuffle moves it")
  for (let k = 0; k < 18; k++) {
    const sp = S.pileSpot(k, 5)
    assert.ok(sp.x > 0.55 && sp.x < 0.8 && sp.y > 0.5 && sp.y < 0.85 && Math.abs(sp.rot) <= 8, "untouched tile " + k + " sits in the lower-right cluster")
  }
}

// the hero's photo field: depth wraps, photos grow as they near, fade at both ends, never cover the headline at rest
{
  const W = 1280, H = 740
  const near = S.flyAt(0.8, 0.6, 1, 0, W, H)
  const far = S.flyAt(0.8, 0.6, 5, 0, W, H)
  assert.ok(near.s > far.s, "nearer photos are bigger")
  assert.ok(Math.abs(near.x - W / 2) > Math.abs(far.x - W / 2), "and further from the centre: the field flies outward")
  assert.equal(S.flyAt(0.5, 0.5, 2, 0, W, H).d, S.flyAt(0.5, 0.5, 2, S.FIELD.depth, W, H).d, "the depth wraps: the flight never runs out")
  assert.equal(S.flyAt(0, 0, 0.2, 0, W, H).o, 0, "too close: gone")
  assert.ok(S.flyAt(0, 0, S.FIELD.depth - 0.01, 0, W, H).o < 0.02, "at the far end: fading in")
  let prev = S.flyAt(0.9, 0.5, 4, 0, W, H)
  for (let cam = 0.02; cam < 3.4; cam += 0.02) {
    const q = S.flyAt(0.9, 0.5, 4, cam, W, H)
    assert.ok(q.s >= prev.s - 1e-12 && q.x >= prev.x - 1e-9, "scrolling only ever flies forward")
    prev = q
  }
  const pts = S.fieldLayout(18, 11)
  assert.equal(pts.length, 18)
  for (const f of pts) assert.ok(!(Math.abs(f.x) < 0.42 && Math.abs(f.y) < 0.36), "no photo starts behind the headline")
  assert.deepEqual(S.fieldLayout(18, 11), pts, "seeded layout")
}

// the card flight: column → title gap → grid slot, continuous, and the gap opens only while it passes
{
  const a = { x: 900, y: 1800, w: 280 }, m = { x: 560, y: 2600, w: 170 }, b = { x: 32, y: 2900, w: 300 }
  assert.deepEqual(S.flightAt(0, a, m, b), a)
  assert.deepEqual(S.flightAt(0.5, a, m, b), m)
  assert.deepEqual(S.flightAt(1, a, m, b), b)
  let prev = S.flightAt(0, a, m, b)
  for (let k = 0.005; k <= 1.0001; k += 0.005) {
    const r = S.flightAt(Math.min(1, k), a, m, b)
    assert.ok(Math.abs(r.x - prev.x) < 25 && Math.abs(r.y - prev.y) < 25, "no jump at k=" + k.toFixed(3))
    prev = r
  }
  assert.equal(S.titleGapAt(0), 0)
  assert.equal(S.titleGapAt(1), 0, "the title closes behind the card")
  assert.equal(S.titleGapAt(0.5), 1, "and is fully open as it passes")
}

// floating thumbnails wrap inside the stage
for (let q = 0; q <= 1; q += 0.05) for (const base of [0, 0.4, 1.1]) {
  const y = S.floatY(base, q, 1.5)
  assert.ok(y >= -0.15 && y < 1.15)
}

// reduced motion: still poses that show the finished state of each scene
assert.equal(S.poseFor(0.05, S.REDUCED.intro), 0, "hero first")
{
  const pose = S.poseFor(0.5, S.REDUCED.intro)
  assert.ok(S.span(pose, S.INTRO.callouts) === 1 && pose < S.coverAt(S.TRACK.intro), "then the curator, callouts complete, before the cover")
  assert.ok(S.span(pose, S.INTRO.captionOut) === 1, "with the caption gone")
}
{
  const n = 6
  const poses = S.zoomPoses(n)
  assert.equal(poses.length, n + 1)
  for (let i = 1; i < poses.length; i++) {
    assert.ok(poses[i][0] > poses[i - 1][0], "poses in order")
    assert.ok(poses[i][0] < S.coverAt(S.TRACK.zoom), "every collection is shown before the cover")
    assert.equal(S.drumAt(poses[i][1], n), i - 1, "pose " + i + " shows a name dead centre")
    assert.equal(S.span(poses[i][1], S.ZOOM.grow), 1, "on a full-bleed scene")
  }
}
assert.equal(S.poseFor(1, S.REDUCED.pile), 1, "the pile ends on the call to action")

// easter egg: every third poke flips golden hour
assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(S.goldenAfter), [false, false, false, true, true, true, false])

// the scroll button walks forward, and wraps to the top at the end
assert.equal(S.nextStop([100, 500, 900], 0), 100)
assert.equal(S.nextStop([100, 500, 900], 100), 500, "never the stop you are on")
assert.equal(S.nextStop([100, 500, 900], 900), -1)

console.log(slug + ": ok")
