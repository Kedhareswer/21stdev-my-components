// Runnable check for components/cutout-sentence: sentence parsing, the
// hole → slot flight, the crop maths, the beat timing, the default harbour
// pieces, and the install-safety rules.
// Run: node tests/cutout-sentence.test.mjs
//
// What breaks silently here is seams: a piece that is a pixel off its hole at
// lift-off, one that never quite lands, a crop that shows the page through the
// window, or a word that appears after the piece it was meant to receive.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/cutout-sentence/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("cutout-sentence.tsx")

const start = src.indexOf("// #region cutout")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "cutout region markers missing")
const C = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// the default content sits outside the region; lift it the same way
const dStart = src.indexOf("export const FLOCK_SRC")
const dEnd = src.indexOf("export type CutoutSentenceProps")
assert.ok(dStart > -1 && dEnd > dStart, "default content missing")
const D = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(dStart, dEnd))))

const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps

// ---- sentence parsing ----------------------------------------------------
{
  const { groups, order, words } = C.parseSentence("A {k}kaleidoscope of {p}painted wings {x}dance, under sky{s}.", ["k", "p", "s"])
  assert.deepEqual(order, ["k", "p", "s"], "pieces in reading order, unknown ids dropped")
  const flat = groups.map((g) => g.map((t) => (t.kind === "word" ? t.text : "{" + t.id + "}")).join("|"))
  assert.deepEqual(flat, ["A", "{k}|kaleidoscope", "of", "{p}|painted", "wings", "dance,", "under", "sky|{s}|."], "a piece written flush hugs its word")
  assert.equal(words, 9)
  const all = groups.flat()
  assert.deepEqual(all.filter((t) => t.kind === "word").map((t) => t.w), [...Array(9).keys()], "words numbered in reading order")
  assert.deepEqual(all.filter((t) => t.kind === "piece").map((t) => t.at), [1, 3, 8], "each piece knows how many words come before it")
  const spaced = C.parseSentence("boats {b} doze", ["b"])
  assert.equal(spaced.groups.length, 3, "a spaced placeholder stands on its own")
  assert.equal(C.parseSentence("{a}opens it", ["a"]).groups[0][0].kind, "piece", "a sentence may start with a piece")
  assert.deepEqual(C.parseSentence("twice {a} and {a}", ["a"]).order, ["a"], "an id is used once")
}

// ---- layout ----------------------------------------------------------------
{
  const box = { x: 0, y: 400, w: 1440, h: 500 }
  const bb = [0.1, 0.4, 0.8, 0.35]
  const c = C.placeImage(1.5, box, bb, 10, true)
  assert.ok(c.w >= box.w && c.h >= box.h, "covers the box when every region fits")
  const bx0 = c.x + bb[0] * c.w, by0 = c.y + bb[1] * c.h
  assert.ok(bx0 >= box.x && by0 >= box.y && bx0 + bb[2] * c.w <= box.x + box.w && by0 + bb[3] * c.h <= box.y + box.h, "regions in view")
  // narrow screen: the picture shrinks to keep every cut in view
  const nb = { x: 0, y: 420, w: 390, h: 424 }
  const n = C.placeImage(1.5, nb, [0.03, 0.4, 0.95, 0.33], 10, true)
  assert.ok(n.w <= nb.w, "shrinks instead of cropping cuts away")
  assert.ok(near(n.x, (nb.w - n.w) / 2), "centred when narrower")
  assert.ok(near(n.y, nb.y), "sits on the top edge when shorter (the default)")
  const nbot = C.placeImage(1.5, nb, [0.03, 0.4, 0.95, 0.33], 10, true, "bottom")
  assert.ok(near(nbot.y + nbot.h, nb.y + nb.h), "…or the bottom edge when asked")
  const full = C.placeImage(1.5, { x: 0, y: 0, w: 390, h: 844 }, bb, 0, false)
  assert.ok(full.w >= 390 && full.h >= 844, "the opening frame always covers")
  const i = C.intersect({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: -5, w: 10, h: 10 })
  assert.deepEqual(i, { x: 5, y: 0, w: 5, h: 5 })
}

// ---- crop: exact at the hole, never shows the page -----------------------
{
  const img = { x: -40, y: 300, w: 1520, h: 1013.33 }
  const region = [0.17, 0.55, 0.11, 0.14]
  const aspect = img.w / img.h
  const hw = region[2] * img.w, hh = region[3] * img.h
  const c = C.cropFor(region, aspect, hw, hh, 1)
  assert.ok(near(c.D, img.w, 1e-3), "at the hole the piece shows the picture at its own scale")
  assert.ok(near(c.ix, -region[0] * img.w, 1e-3) && near(c.iy, -region[1] * img.h, 1e-3), "…and at its own offset")
  for (const [w, h, z] of [[80, 50, 1], [200, 60, 0.7], [40, 140, 0.74], [300, 300, 1]]) {
    const k = C.cropFor(region, aspect, w, h, z)
    assert.ok(k.ix <= 1e-9 && k.iy <= 1e-9 && k.ix + k.D >= w - 1e-9 && k.iy + k.Dh >= h - 1e-9, "image always covers the window")
  }
  const edge = C.cropFor([0.95, 0.9, 0.05, 0.1], 1.5, 120, 60, 0.6)
  assert.ok(edge.ix + edge.D >= 120 - 1e-9, "clamped at the picture's edge")
}

// ---- flight: leaves the hole exactly, lands exactly -----------------------
{
  const a = { x: 300, y: 600, w: 120, h: 90 }
  const b = { x: 520, y: 140, w: 70, h: 52 }
  for (const side of [-1, 1]) {
    const f0 = C.flight(0, a, b, side)
    assert.ok(near(f0.x, a.x) && near(f0.y, a.y) && near(f0.w, a.w) && near(f0.h, a.h), "u = 0 is the hole")
    assert.ok(near(f0.scale, 1) && near(f0.rot, 0) && near(f0.zoom, 1) && near(f0.shadow, 0))
    const f1 = C.flight(1, a, b, side)
    assert.ok(near(f1.x, b.x) && near(f1.y, b.y) && near(f1.w, b.w) && near(f1.h, b.h), "u = 1 is the slot")
    assert.ok(near(f1.scale, 1) && near(f1.rot, 0) && near(f1.zoom, 1) && near(f1.shadow, 0) && near(f1.edge, 0))
    const m = C.flight(0.5, a, b, side)
    assert.ok(m.zoom < 0.9, "the window opens onto the surroundings mid-flight")
    assert.ok(Math.sign(m.rot) === side, "tilts toward its bow")
    assert.ok(m.scale > 1 && m.shadow > 0.5, "lifted while flying")
    assert.ok((m.x + m.w / 2 - (a.x + a.w / 2 + b.x + b.w / 2) / 2) * side > 0, "the path bows to its side")
    let prevY = Infinity
    for (let u = 0.1; u <= 1; u += 0.05) {
      const f = C.flight(u, a, b, side)
      assert.ok(Number.isFinite(f.x + f.y + f.w + f.h + f.rot + f.scale), "finite everywhere")
      assert.ok(f.w > 0 && f.h > 0)
      assert.ok(f.y + f.h / 2 <= prevY + 12, "climbs toward the sentence")
      prevY = f.y + f.h / 2
    }
  }
  const still = C.flight(0.5, a, a, 1)
  assert.ok(Number.isFinite(still.x), "a zero-length flight does not divide by zero")
}

// ---- beats -----------------------------------------------------------------
{
  for (const n of [1, 2, 4, 7, 12]) {
    let prev = -1
    for (let i = 0; i < n; i++) {
      const [a, b] = C.flightWindow(i, n)
      assert.ok(a >= C.LOWER[1], "nothing lifts before the picture has settled")
      assert.ok(a > prev, "pieces leave in reading order")
      assert.ok(b <= C.FLY[1] + 1e-9 && b < C.SETTLED, "every piece has landed before the section counts as settled")
      const [sa] = C.scoreWindow(i, n)
      assert.ok(sa < a, "a cut is scored before it lifts")
      prev = a
    }
  }
  const total = 14
  let prevS = -1
  for (let w = 0; w < total; w++) {
    const [s0, e0] = C.wordWindow(w, total)
    assert.ok(s0 >= C.TYPE[0] - 1e-9 && e0 <= C.TYPE[1] + 1e-9 && e0 > s0, "words type inside their beat")
    assert.ok(s0 > prevS, "left to right")
    prevS = s0
  }
  assert.ok(C.TYPE[0] >= C.LOWER[0] && C.TYPE[1] <= C.FLY[0] + 1e-9, "the sentence is written, braces empty, before anything drops")
  assert.ok(C.SCORE[1] <= C.FLY[0] + 1e-9 && C.SCORE[0] >= C.LOWER[1], "cuts are traced after the photo settles, before the first lift")
  assert.equal(C.ramp(0.5, 0.2, 0.2), 1, "a zero-length ramp is a step, not NaN")
  assert.ok(near(C.easeOutBack(1), 1) && near(C.easeOutBack(0), 0))
  assert.ok(Math.max(...[...Array(50).keys()].map((k) => C.easeOutBack(k / 50))) > 1, "the landing overshoots")
}

// ---- default flock pieces ------------------------------------------------
{
  const ids = D.FLOCK_PIECES.map((p) => p.id)
  const { order } = C.parseSentence(D.FLOCK_SENTENCE, ids)
  assert.deepEqual([...order].sort(), [...ids].sort(), "every default piece has a place in the sentence")
  for (const p of D.FLOCK_PIECES) {
    const [x, y, w, h] = p.region
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 1 && y + h <= 1, p.id + " is inside the photo")
    assert.ok(D.FLOCK_SENTENCE.includes("{" + p.id + "}" + p.word), p.id + " hugs the word it shows")
  }
  const R = D.FLOCK_PIECES.map((p) => p.region)
  for (let i = 0; i < R.length; i++)
    for (let j = i + 1; j < R.length; j++) {
      const [ax, ay, aw, ah] = R[i], [bx, by, bw, bh] = R[j]
      assert.ok(ax + aw <= bx || bx + bw <= ax || ay + ah <= by || by + bh <= ay, ids[i] + " and " + ids[j] + " must not share pixels")
    }
  // a 16:10 desktop stage with the photo on top keeps it full-bleed
  const c = C.placeImage(1.5, { x: 0, y: 0, w: 1440, h: 468 }, C.regionsBox(R), 17, true)
  assert.ok(c.w >= 1440, "the default cuts fit a full-bleed photo on desktop")
  assert.match(D.FLOCK_SRC, /^https:\/\/cdn\.jsdelivr\.net\/gh\/Kedhareswer\/21stdev-my-components@main\/media\/cutout-sentence\/flock\.jpg$/)
}

// ---- install safety ---------------------------------------------------------
{
  const styleBlock = src.slice(src.indexOf("const CSS = `") + 13, src.indexOf("`", src.indexOf("const CSS = `") + 13))
  assert.ok(styleBlock.length > 200, "CSS block found")
  assert.doesNotMatch(styleBlock, /\$\{/, "no interpolation inside the CSS")
  assert.doesNotMatch(styleBlock, /@import/, "no @import")
  assert.doesNotMatch(styleBlock, /(^|[},])\s*(\*|body|html|:root)\s*[{,]/m, "no bare resets")
  assert.match(styleBlock, /prefers-reduced-motion/, "reduced motion handled in CSS")
  assert.match(styleBlock, /\.cs-root\{[^}]*overflow:clip/, "overflow:clip, never hidden — hidden would stop the sticky stage")
  assert.match(styleBlock, /\.cs-stage\{position:sticky/)
  assert.doesNotMatch(src, /\bh-full\b/, "never h-full")
  assert.match(src, /height = "100svh"/, "a definite default height")
  assert.match(styleBlock, /\.cs-img\{[^}]*max-width:none/, "Preflight cannot collapse the picture")
  assert.match(styleBlock, /\.cs-card img\{[^}]*max-width:none/, "…or a piece's copy of it")
  assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion handled in JS")
  assert.doesNotMatch(src, /window\.scrollY|pageYOffset/, "progress comes off the element, not the window")
  assert.deepEqual([...src.matchAll(/https?:\/\/[^\s"']+/g)].map((m) => m[0]), [D.FLOCK_SRC], "the default photo is the only thing loaded")
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
  for (const m of src.matchAll(/from "([^".][^"]*)"/g)) {
    const name = m[1].startsWith("@") ? m[1].split("/").slice(0, 2).join("/") : m[1].split("/")[0]
    assert.ok(name === "react" || pkg.dependencies[name], m[1] + " is declared in the root package.json")
  }
  for (const f of ["demo.tsx", "demo-autoplay.tsx"]) {
    const d = read(f)
    assert.match(d, /from "@\/components\/ui\/cutout-sentence"/, f + " imports the installed path")
    assert.match(d, /className="w-full"/, f + " stays full-width inside 21st's flex wrapper")
  }
}

console.log("cutout-sentence: ok")
