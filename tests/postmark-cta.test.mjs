// Checks for components/postmark-cta.
// Run: node tests/postmark-cta.test.mjs
//
// The perforation geometry, the engraved subjects, the spring and throw maths,
// the halftone field and the keep-off-the-copy layout live in the .tsx so the
// published component stays one file; the marked region is lifted out and run.
// The rest are the install-safety rules: no inherited height, CSS that cannot
// leak into the host page, no generics the 21st CLI chokes on, reduced motion.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(new URL("../components/postmark-cta/postmark-cta.tsx", import.meta.url), "utf8")

const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "logic region markers missing")
const m = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- perforations: whole holes along every side, corners bitten, a closed outline
{
  const p = m.perforatedPath(100, 122, 6.4)
  assert.equal(p.nx, 16)
  assert.equal(p.ny, 19)
  assert.ok(p.d.startsWith("M") && p.d.endsWith("Z"))
  const arcs = p.d.match(/A/g).length
  assert.equal(arcs, 2 * (p.nx - 1) + 2 * (p.ny - 1) + 4, "one bite per hole, four corner bites")
  assert.ok(p.r > 1 && p.r < 6.4 / 2, "holes smaller than the pitch, so teeth remain")
  // every coordinate stays on the paper
  const nums = p.d.replace(/[MLAZ]/g, " ").trim().split(/\s+/).map(Number)
  assert.ok(nums.every((n) => n >= 0 && n <= 122), "outline stays inside its box")
  const small = m.perforatedPath(40, 40, 6.4)
  assert.equal(small.nx, small.ny)
}

// ---- headline markup
assert.deepEqual(m.parseHeadline("Your passport is\n*getting bored.*"), [
  [{ text: "Your passport is", hi: false }],
  [{ text: "getting bored.", hi: true }],
])
assert.deepEqual(m.parseHeadline("Dinner, *sorted* by Tuesday."), [
  [
    { text: "Dinner, ", hi: false },
    { text: "sorted", hi: true },
    { text: " by Tuesday.", hi: false },
  ],
])
assert.deepEqual(m.parseHeadline("plain"), [[{ text: "plain", hi: false }]])

// ---- springs settle, stay stable at any frame rate, and throws project forward
for (const dt of [1 / 240, 1 / 120, 1 / 60]) {
  let x = 0
  let v = 0
  for (let t = 0; t < 2; t += dt) [x, v] = m.springStep(x, v, 100, dt, 0.5, 0.86)
  assert.ok(Math.abs(x - 100) < 0.5 && Math.abs(v) < 5, "spring settles at dt " + dt)
}
{
  let x = 0
  let v = 0
  let peak = 0
  for (let i = 0; i < 400; i++) {
    ;[x, v] = m.springStep(x, v, 10, 1 / 120, 0.4, 0.5)
    peak = Math.max(peak, x)
  }
  assert.ok(peak > 10 && peak < 13.5, "an underdamped tilt overshoots a little, never wildly")
}
assert.ok(m.project(800) > 0 && m.project(-800) < 0)
assert.ok(m.project(800) > m.project(200), "a harder throw travels further")
assert.equal(m.project(0), 0)
assert.ok(Math.abs(m.rubber(200, 400)) < 200 && m.rubber(200, 400) > 0, "past the edge it follows, but less")
assert.equal(m.band(50, 0, 100, 400), 50)
assert.ok(m.band(-80, 0, 100, 400) < 0 && m.band(-80, 0, 100, 400) > -80)

// ---- halftone field: quiet behind the copy, heavy at the bottom
for (let y = 0; y <= 1; y += 0.1) for (let x = 0; x <= 1; x += 0.1) {
  const r = m.dotSize(x, y)
  assert.ok(r >= 0 && r <= 1, "dot size in range")
}
assert.ok(m.dotSize(0.5, 0.48) < 0.15, "the copy sits on a clear field")
assert.ok(m.dotSize(0.5, 0.98) > m.dotSize(0.5, 0.75), "dots grow toward the bottom")
assert.ok(m.dotSize(0.1, 0.95) > 0.5)

// ---- every engraved subject exists, stays in range and has real tonal range
const artUnion = src.slice(src.indexOf("export type StampArt ="), src.indexOf("export type StampShape"))
const arts = [...artUnion.matchAll(/\| "([a-z]+)"/g)].map((x) => x[1])
assert.equal(arts.length, 16, "sixteen subjects in the StampArt union")
for (const a of arts) {
  const scene = m.SCENES[a]
  assert.equal(typeof scene, "function", "scene for " + a)
  let lo = 1
  let hi = 0
  let tint = 0
  for (let v = 0.01; v < 1; v += 0.02)
    for (let u = 0.01; u < 1; u += 0.02) {
      const [l, t, b] = scene(u, v)
      assert.ok(l >= 0 && l <= 1 && t >= 0 && t <= 1 && Number.isFinite(b), a + " sample in range at " + u + "," + v)
      assert.ok(Math.abs(b) < 0.2, a + " bends lines gently")
      lo = Math.min(lo, l)
      hi = Math.max(hi, l)
      tint = Math.max(tint, t)
    }
  assert.ok(lo < 0.35, a + " has real darks (" + lo.toFixed(2) + ")")
  assert.ok(hi > 0.9, a + " has real lights")
  assert.ok(tint > 0.5, a + " uses the second ink")
}
{
  const rings = m.engraveLines(m.SCENES.sphere, 140, 160, 2.4)
  assert.ok(rings.length >= Math.ceil(160 / 2.4), "one ribbon per engraved line, plus hatching")
  for (const r of rings) {
    assert.equal(r.length % 2, 0)
    for (let i = 0; i < r.length; i += 2) assert.ok(r[i] >= -2 && r[i] <= 142 && r[i + 1] > -12 && r[i + 1] < 172)
  }
}

// ---- stamps keep off the copy
{
  const frame = { left: 0, top: 0, right: 1440, bottom: 900 }
  const copy = [{ left: 500, top: 600, right: 900, bottom: 640 }]
  assert.deepEqual(m.clearOf({ left: 100, top: 100, right: 260, bottom: 300 }, copy, frame, 20), [0, 0, 1], "a clear stamp stays put")
  const b = { left: 820, top: 580, right: 990, bottom: 790 }
  const [dx, dy] = m.clearOf(b, copy, frame, 20)
  const moved = { left: b.left + dx, right: b.right + dx, top: b.top + dy, bottom: b.bottom + dy }
  assert.ok(moved.left >= 920 || moved.top >= 660 || moved.bottom <= 580, "an overlapping stamp is moved clear")
  assert.ok(Math.hypot(dx, dy) <= 100 + 1e-6, "by the shortest way out")
  // a stamp thrown onto the note line, near the bottom edge: it may not leave the frame to get clear
  const note = [{ left: 560, top: 820, right: 880, bottom: 840 }]
  const dropped = { left: 700, top: 760, right: 860, bottom: 895 }
  const [ex, ey, ok] = m.clearOf(dropped, note, frame, 24)
  assert.equal(ok, 1, "there is room beside the note")
  assert.ok(dropped.bottom + ey <= 900 && dropped.top + ey >= 0 && dropped.right + ex <= 1440 && dropped.left + ex >= 0, "and it stays fully inside")
  assert.ok(dropped.left + ex >= 880 + 24 || dropped.right + ex <= 560 - 24 || dropped.bottom + ey <= 820 - 24, "clear of the note")
  // nowhere to go: the caller sends it home
  const tight = { left: 0, top: 0, right: 200, bottom: 200 }
  const [, , none] = m.clearOf({ left: 20, top: 20, right: 180, bottom: 180 }, [{ left: 0, top: 0, right: 200, bottom: 200 }], tight, 24)
  assert.equal(none, 0, "reports when no clear spot exists")
}

// ---- layout: seven slots, the first four are the phone's
assert.equal(m.SLOTS.length, 7)
assert.deepEqual(
  m.SLOTS.map((s) => !!s.c),
  [true, true, true, true, false, false, false],
)

// ---- colour: every preset reads, light and dark
const pals = [...src.matchAll(/(light|dark): \{ ground: "(#[0-9a-f]{6})", dotsTop: "(#[0-9a-f]{6})", dotsBottom: "(#[0-9a-f]{6})", ink: "(#[0-9a-f]{6})", muted: "(#[0-9a-f]{6})", accent: "(#[0-9a-f]{6})", onAccent: "(#[0-9a-f]{6})", highlight: "(#[0-9a-f]{6})" \}/g)]
assert.equal(pals.length, 6, "three presets, light and dark")
for (const [, mode, ground, , , ink, muted, accent, onAccent, highlight] of pals) {
  assert.ok(m.contrast(ink, ground) >= 7, mode + " headline on the field")
  assert.ok(m.contrast(muted, ground) >= 4.5, mode + " " + muted + " body copy is " + m.contrast(muted, ground).toFixed(2))
  assert.ok(m.contrast(onAccent, accent) >= 4.5, mode + " " + accent + " button label is " + m.contrast(onAccent, accent).toFixed(2))
  assert.ok(m.contrast(highlight, ground) >= 3, mode + " " + highlight + " highlighted display words are " + m.contrast(highlight, ground).toFixed(2))
}
// stamp inks print on paper
for (const [, ink] of src.matchAll(/ink: "(#[0-9a-f]{6})", tint:/g)) assert.ok(m.contrast(ink, "#fbf7ee") >= 4.5, "stamp ink " + ink + " reads on paper")
assert.ok(Number.isNaN(m.contrast("red", "#fff")))
assert.equal(m.mix("#000000", "#ffffff", 0.5), "rgb(128,128,128)")
assert.equal(m.postmarkDate(new Date(2026, 9, 5)), "05 OCT 2026")

// ---- install safety (source assertions)
const css = src.slice(src.indexOf("const CSS = `") + 13, src.indexOf("`", src.indexOf("const CSS = `") + 13))
assert.ok(css.length > 2000, "CSS block found")
assert.ok(!css.includes("${"), "no template interpolation inside the CSS")
assert.ok(!/@import/.test(css), "no @import")
assert.ok(!/(^|\})\s*(\*|body|html|:root)\s*[,{]/m.test(css), "no bare *, body, html or :root rules")
for (const rule of css.split("}")) {
  const sel = rule.split("{")[0].trim()
  if (!sel || sel.startsWith("@") || /^(from|to|\d+%)/.test(sel)) continue
  for (const part of sel.split(",")) assert.ok(/\.pm/.test(part), "selector is scoped: " + part.trim())
}
assert.ok(/prefers-reduced-motion: reduce/.test(css), "reduced motion is honoured in CSS")
assert.ok(/prefers-reduced-motion: reduce/.test(src.slice(src.indexOf("export default function"))), "and in the throw physics")
assert.ok(/\.pm-art canvas, \.pm-art img \{[^}]*max-width: none/.test(css), "art is guarded against Preflight max-width")
assert.ok(/\.pm-dots \{[^}]*max-width: none/.test(css))
assert.ok(!/\bh-full\b/.test(src), "no h-full anywhere")
assert.ok(/height = "min\(100svh, 920px\)"/.test(src), "the section defaults to a definite height")
assert.ok(!/from "\.\.?\//.test(src), "no local imports")
assert.ok(!/fonts\.googleapis|@font-face/.test(src), "no web fonts")
const head = src.slice(0, src.indexOf("</"))
assert.ok(!/use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /.test(head), "no generics before the first JSX close tag")
assert.ok(/aria-labelledby=\{headingId\}/.test(src) && /<h2 id=\{headingId\}/.test(src), "the section is named by its headline")
assert.ok(/<div aria-hidden="true">\s*\{stamps\.map/.test(src), "the stamps are decoration to assistive tech")
assert.ok(/onPointerDown: post/.test(src), "the postmark starts on pointer-down, before the click")
assert.ok(/postDelay = 0,/.test(src) && /postDelay <= 0/.test(src), "navigation is never delayed unless asked for")
assert.ok(/e\.metaKey \|\| e\.ctrlKey/.test(src), "a delayed link still opens in a new tab when asked")
assert.ok(/touch-action: pan-y/.test(css), "a phone can still scroll past the stamps")
assert.ok(/onError=\{\(\) => setFailed\(true\)\}/.test(src), "a broken photo falls back to the engraving")
assert.ok(/nowhere clear to land: go home/.test(src), "a throw that cannot land clear of the copy goes home")
for (const p of ["voyage", "pantry", "atelier"]) {
  const block = src.slice(src.indexOf("  " + p + ": {"), src.indexOf("postOn: 2", src.indexOf("  " + p + ": {")))
  assert.ok((block.match(/cancelled: true/g) ?? []).length <= 1, p + " pre-cancels at most one stamp, so the live postmark stays the event")
  assert.ok(/frame: "oval"/.test(block) && /frame: "bare"/.test(block) && /shape: "landscape"/.test(block) && /shape: "round"/.test(block), p + " mixes stamp layouts")
}

for (const d of ["demo.tsx", "demo-pantry.tsx", "demo-atelier.tsx"]) {
  const demo = readFileSync(new URL("../components/postmark-cta/" + d, import.meta.url), "utf8")
  assert.ok(demo.includes('from "@/components/ui/postmark-cta"'), d + " imports the installed path")
  assert.ok(/export default function \w*Demo\(/.test(demo), d + " exports a named demo function")
}

console.log("postmark-cta: all checks passed")
