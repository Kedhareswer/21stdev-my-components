// Runnable check for components/signature-pen-footer: the script layout, the
// stroke sampling the pen follows, the pen timeline, plus the install-safety rules.
// Run: node tests/signature-pen-footer.test.mjs
//
// What breaks silently here: letters that should flow into each other written as
// separate lifts, an i-dot made mid-word instead of at the end, samples that
// drift off the drawn curve (the nib floats beside the ink), and a timeline that
// leaves a stroke half-inked or the pen somewhere other than its rest.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/signature-pen-footer/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("signature-pen-footer.tsx")

const start = src.indexOf("// #region signature")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "signature region markers missing")
const T = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- glyph data ----------------------------------------------------------------
{
  for (let c = 33; c <= 126; c++) {
    const ch = String.fromCharCode(c)
    const g = T.GLYPHS[ch]
    assert.ok(g, "missing glyph " + JSON.stringify(ch))
    assert.ok(g[0] > 0, ch + " has an advance")
    for (const part of g[1].split("|")) {
      const n = part.trim().split(/\s+/).map(Number)
      assert.ok(n.length >= 4 && n.length % 2 === 0, ch + " stroke has whole points")
      assert.ok(n.every(Number.isFinite), ch + " has only numbers")
    }
  }
  assert.equal(T.parseGlyph(" ").strokes.length, 0)
  assert.equal(T.parseGlyph("é"), null)
}

// ---- layout --------------------------------------------------------------------
{
  const a = T.layoutWord("Finished")
  assert.deepEqual(T.layoutWord("Finished"), a, "reproducible")
  // F is three marks, the lowercase run is 6 pen-downs, and the two i-dots come last.
  assert.equal(a.strokes.length, 11, "Finished pen-downs, got " + a.strokes.length)
  for (const s of a.strokes.slice(-2)) assert.ok(s.len < 120, "the i-dots are made last")
  for (const s of a.strokes.slice(0, -2)) assert.ok(s.len > 300, "no dot is made mid-word")
  // Letters whose ends meet are one stroke.
  assert.equal(T.layoutWord("ni").strokes.length, 2, "n flows into i: one line plus its dot")
  assert.equal(T.layoutWord("nini").strokes.length, 4, "i into n lifts, so two lines and two dots")
  // t bars wait for the end too.
  const t = T.layoutWord("tt")
  assert.equal(t.strokes.length, 3, "two t's flow as one line, then two bars")
  assert.ok(t.strokes.slice(-2).every((s) => s.len < 260), "bars come last")
  // Box wraps every sample.
  for (const s of a.strokes)
    for (let i = 0; i < s.pts.length; i += 2) {
      assert.ok(s.pts[i] >= a.box.x - 1 && s.pts[i] <= a.box.x + a.box.w + 1, "x inside box")
      assert.ok(s.pts[i + 1] >= a.box.y - 1 && s.pts[i + 1] <= a.box.y + a.box.h + 1, "y inside box")
    }
  // Accents are stripped, unknowns are spaces, empty is empty.
  assert.deepEqual(T.layoutWord("Merci élan").strokes.map((s) => s.d), T.layoutWord("Merci elan").strokes.map((s) => s.d))
  const odd = T.layoutWord("hi 🙂 yo")
  assert.ok(odd.strokes.length > 0 && odd.strokes.every((s) => Number.isFinite(s.len)))
  assert.deepEqual(T.layoutWord(""), { strokes: [], box: { x: 0, y: 0, w: 0, h: 0 } })
  assert.deepEqual(T.layoutWord(undefined).strokes, [])
}

// ---- smoothing + sampling --------------------------------------------------------
{
  // A cusp (the line doubles back) stays sharp: its handle sits on the point.
  const c = T.smoothCubics([[0, 0], [100, 100], [10, 0]])
  assert.equal(c.length, 2)
  assert.deepEqual(c[0][2], [100, 100], "cusp keeps a sharp corner")
  // A gentle bend is smoothed.
  const g = T.smoothCubics([[0, 0], [100, 10], [200, 0]])
  assert.notDeepEqual(g[0][2], [100, 10], "bends are smoothed")
  const s = T.buildStroke([[0, 0], [100, 0], [200, 0]])
  assert.ok(Math.abs(s.len - 200) < 0.5, "a straight stroke measures true")
  assert.match(s.d, /^M0 0C/)
  assert.deepEqual(T.pointAt(s, 50).map(Math.round), [50, 0])
  assert.deepEqual(T.pointAt(s, -5), [0, 0])
  assert.deepEqual(T.pointAt(s, 9e9), [200, 0])
  for (let i = 1; i < s.acc.length; i++) assert.ok(s.acc[i] >= s.acc[i - 1], "arc length only grows")
}

// ---- timeline --------------------------------------------------------------------
{
  const { strokes, box } = T.layoutWord("Finished")
  const plan = T.planTimeline(strokes, box, 2.6)
  const draw = plan.segs.filter((s) => s.kind === "draw")
  assert.equal(draw.length, strokes.length, "every stroke is drawn once")
  const nib = draw.reduce((a, s) => a + s.t1 - s.t0, 0)
  assert.ok(Math.abs(nib - 2.6) < 1e-6, "duration is the nib-on-paper time")
  for (let i = 1; i < plan.segs.length; i++) assert.ok(plan.segs[i].t0 >= plan.segs[i - 1].t1 - 1e-9, "segments in order")
  assert.ok(plan.writeEnd < plan.total)

  const begin = T.penAt(plan, strokes, 0)
  assert.ok(begin.lift >= 3.9, "starts high, off the page")
  assert.ok(begin.ink.every((v) => v === 0))

  // While drawing, the nib is down and sits on the ink it is laying.
  const d = draw[2]
  const mid = T.penAt(plan, strokes, (d.t0 + d.t1) / 2)
  assert.equal(mid.lift, 0)
  assert.ok(mid.ink[2] > 0 && mid.ink[2] < 1 && mid.ink[1] === 1 && mid.ink[3] === 0)
  const at = T.pointAt(strokes[2], mid.ink[2] * strokes[2].len)
  assert.ok(Math.hypot(at[0] - mid.x, at[1] - mid.y) < 1e-6, "nib is on the line")

  // Between strokes the pen arcs up.
  const hop = plan.segs.find((s, i) => s.kind === "fly" && i > 0 && i < plan.segs.length - 1)
  assert.ok(T.penAt(plan, strokes, (hop.t0 + hop.t1) / 2).lift > 0.2, "pen lifts between strokes")

  const end = T.penAt(plan, strokes, plan.total + 1)
  assert.ok(end.ink.every((v) => v === 1), "everything inked at the end")
  assert.deepEqual([end.x, end.y], plan.rest, "comes to rest")
  assert.ok(plan.rest[0] > box.x + box.w, "rests beside the word, not on it")

  for (let i = 0; i <= 50; i++) {
    const st = T.penAt(plan, strokes, (plan.total * i) / 50)
    assert.ok(Number.isFinite(st.x) && Number.isFinite(st.y) && Number.isFinite(st.lift), "finite at every frame")
  }
  assert.ok(T.drawEase(0) === 0 && T.drawEase(1) === 1 && T.drawEase(0.5) === 0.5)
  for (let i = 1; i <= 20; i++) assert.ok(T.drawEase(i / 20) > T.drawEase((i - 1) / 20), "never stalls")

  const empty = T.planTimeline([], { x: 0, y: 0, w: 0, h: 0 })
  assert.equal(empty.total, 0)
  assert.deepEqual(T.penAt(empty, [], 1).ink, [])
  assert.ok(T.planTimeline(strokes, box, NaN).total > 0, "a bad duration falls back")

  assert.match(T.docId("Finished"), /^[0-9A-F]{4}-[0-9A-F]{4}$/)
  assert.equal(T.docId("Finished"), T.docId("Finished"))
  assert.notEqual(T.docId("Finished"), T.docId("Thank you"))
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

const css = src.slice(src.indexOf("const CSS ="), src.indexOf("const reducedMotion"))
for (const m of css.matchAll(/"([^"]*)\{/g)) {
  for (const raw of m[1].replace(/^.*\}/, "").split(",")) {
    const sel = raw.trim()
    if (!sel || sel.startsWith("@")) continue
    assert.ok(/^(\.spf|:where\(\.spf\)|\.dark \.spf)/.test(sel), "unscoped CSS rule: " + sel)
  }
}
assert.ok(css.includes(":where(.spf) button{"), "buttons are reset at zero specificity")
// CSS variables don't resolve in SVG presentation attributes; they must go through style.
assert.doesNotMatch(src, /(stopColor|stopOpacity|fillOpacity|stroke|fill)="(var|calc)\(/, "no var() in presentation attributes")

assert.ok(src.includes('height = "100svh"'), "definite default height")
assert.ok(src.includes("minHeight: height"))
assert.ok(css.includes("container-type:inline-size"), "the root is a size container")
assert.ok(css.includes("overflow:hidden;overflow:clip;"), "the root clips the long barrel instead of scrolling")
assert.ok(css.includes("max-width:none"), "svgs opt out of Preflight's max-width")

// Motion.
assert.ok(css.includes("@media (prefers-reduced-motion: reduce){"), "honours reduced motion")
assert.ok(src.includes('window.matchMedia?.("(prefers-reduced-motion: reduce)")'), "the pen does too")
assert.ok(src.includes("cancelAnimationFrame(raf)"), "the loop is stopped")
assert.ok(src.includes("io?.disconnect()"), "the observer is cleaned up")
assert.ok(src.includes('window.removeEventListener("scroll", onScroll)'), "scroll listener removed")
assert.ok(src.includes("timers.forEach((id) => clearTimeout(id))"), "ink-drying timers are cleared")
assert.ok(src.includes('e.pointerType !== "touch"'), "touch scrolls the page instead of writing")

// Accessibility.
assert.ok(src.includes('aria-label={"Signature: " + word}'), "the signature has a text alternative")
assert.ok(src.includes('aria-label="Sign again"'), "replay is a labelled button")
assert.ok(src.includes('<nav aria-label="Footer">'))
assert.ok(src.includes("if (isHashLink(a.href)) e.preventDefault()"), "# links leave the page hash alone")

for (const f of ["demo.tsx", "demo-scroll.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/signature-pen-footer"'), f + " imports the installer path")
  assert.ok(demo.match(/className="[^"]*"/), f + " has a wrapper")
  const first = demo.match(/className="[^"]*"/)[0]
  assert.ok(/\bw-(full|screen|\[|\d)/.test(first), f + ": wrapper has a width")
}

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(
  tsconfig.includes('"@/components/ui/signature-pen-footer": ["./components/signature-pen-footer/signature-pen-footer.tsx"]'),
  "tsconfig path missing",
)

console.log("signature-pen-footer: ok")
