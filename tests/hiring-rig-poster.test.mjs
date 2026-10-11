// Install-safety and lifted-logic check for components/hiring-rig-poster.
// Run: node tests/hiring-rig-poster.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/hiring-rig-poster/", import.meta.url)
const src = readFileSync(new URL("hiring-rig-poster.tsx", dir), "utf8")
const demos = ["demo.tsx", "demo-night.tsx"].map((f) => readFileSync(new URL(f, dir), "utf8"))

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.deepEqual(
  readdirSync(dir).sort(),
  ["README.md", "demo-night.tsx", "demo.tsx", "hiring-rig-poster.tsx"],
  "the folder ships the component, its demos and a README — nothing else",
)
for (const d of demos) {
  assert.ok(d.includes('from "@/components/ui/hiring-rig-poster"'), "demos import the installed path")
  assert.ok(d.includes('className="w-full"'), "demos give the flex item a width")
  assert.doesNotMatch(d, /https?:\/\//, "demos load nothing from other origins")
}
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/hiring-rig-poster"'), "tsconfig paths has the component's line")

assert.ok(src.includes('height = "100svh"'), "root height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere: percentage heights collapse on an installed page")
assert.ok(/style=\{\s*\{\s*height,/.test(src), "the root takes its height from the prop")

// Generic type arguments hang the 21st CLI tokenizer (see commit a73538c).
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments")
assert.doesNotMatch(src, /\b(Record|Array|MutableRefObject|RefObject|Set|Map|Promise)</, "no generic utility types")

// Fonts arrive by <link>, never an @import, and can be switched off. Nothing else is remote.
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('document.createElement("link")'), "fonts are injected as a link")
assert.ok(src.includes("if (!fontHref) return"), "fontHref={null} must load nothing")
const urls = [...src.matchAll(/https?:\/\/[^\s"'`)]+/g)].map((m) => m[0])
assert.ok(urls.length > 0 && urls.every((u) => u.startsWith("https://fonts.googleapis.com/")), "the font is the only remote asset")

// The scoped CSS string: prefixed selectors only, no bare resets, no template holes.
const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{/, "no backticks or ${ in the CSS string")
for (const bad of [/"\*\s*\{/, /[{}"]\s*body\s*\{/, /:root/, /[{}"]\s*html\s*\{/])
  assert.doesNotMatch(css, bad, "no bare resets in the CSS: " + bad)
let rules = 0
for (const rule of css.matchAll(/(?:^|[{}"])\s*([^{}"@][^{}"]*)\{/g)) {
  const sel = rule[1].trim()
  if (!sel || /^(from|to|\d+%)/.test(sel) || sel.startsWith("+")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".hrp-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 40, "expected a full scoped sheet, saw " + rules + " rules")
assert.ok(css.includes("prefers-reduced-motion"), "CSS honours reduced motion")

// Preflight: canvases and absolutely-sized SVGs must not be clamped by max-width.
assert.ok((src.match(/maxWidth: "none"/g) || []).length >= 10, "media guard Preflight's max-width")
// a CSS transform replaces an SVG transform attribute: glyphs are placed by a wrapper group
assert.ok(src.includes('<g key={i} transform={"translate(" + (4 + gl.col * 31)'), "glyphs are positioned by their group")
assert.doesNotMatch(src, /className="hrp-gl"[^>]*transform=/, "an animated glyph carries no transform attribute")

// Runtime hygiene.
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 2)"), "cap DPR at 2")
assert.ok(src.includes('"visibilitychange"') && src.includes("IntersectionObserver"), "pause off-screen")
assert.ok(src.includes('matchMedia("(prefers-reduced-motion: reduce)")'), "reduced motion is read")
assert.ok(src.includes("if (visible && (!still || now < busyUntil.current))"), "reduced motion stops the clock between changes")
for (const gone of [
  "cancelAnimationFrame(raf)", "io.disconnect()", "ro.disconnect()",
  'document.removeEventListener("visibilitychange", onVis)', "window.clearTimeout(t)", "audio.current.close()",
]) assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes("onApplyRef.current?.()"), "onApply is read through a ref")
assert.ok(src.includes("aria-pressed={soundOn}"), "the speaker is a toggle button")
assert.ok(src.includes('aria-label={"LED screen: " + ledLabel'), "the LED canvas is described for screen readers")
assert.doesNotMatch(src, /aria-live/, "the ticking countdown must not announce itself every second")
assert.ok(src.includes('touchAction: "pan-y"'), "vertical swipes still scroll the page on touch screens")
assert.ok(src.includes('target.closest("button, a, [data-hrp-nodrag]")'), "pressing a control never starts a drag")

// ---- the lifted logic ---------------------------------------------------------------
const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "logic region markers missing")
const L = await import(
  "data:text/javascript," +
    encodeURIComponent(
      stripTypeScriptTypes(src.slice(start, end)) +
        "\nexport { rng, hexRGB, mix, luma, DOTS, DOT_ALIAS, layoutText, composeScreen, SEG, segCells, segPolys," +
        " countdown, parseDeadline, rollAt, rotateAbout, placeCable, smoothPath, swingStep, fluidSurface, fluidPath," +
        " fitStage, VIEW, CORE }",
    )
)

{
  const a = L.rng(5)
  const b = L.rng(5)
  for (let i = 0; i < 50; i++) {
    const x = a()
    assert.equal(x, b(), "rng is deterministic")
    assert.ok(x >= 0 && x < 1, "rng in [0, 1)")
  }
  assert.deepEqual(L.hexRGB("#ff7a1a", [0, 0, 0]), [255, 122, 26])
  assert.deepEqual(L.hexRGB("#fff", [0, 0, 0]), [255, 255, 255])
  assert.deepEqual(L.hexRGB("orange", [1, 2, 3]), [1, 2, 3], "non-hex falls back")
  assert.deepEqual(L.hexRGB(undefined, [1, 2, 3]), [1, 2, 3], "missing falls back")
  assert.deepEqual(L.mix([0, 0, 0], [200, 100, 50], 0.5), [100, 50, 25])
  assert.ok(L.luma([255, 255, 255]) > 250 && L.luma([0, 0, 0]) === 0)
}

// the LED face
{
  for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !?.,:-~*") assert.ok(L.DOTS[ch], "the face has " + JSON.stringify(ch))
  for (const [ch, g] of Object.entries(L.DOTS)) {
    const rows = g.split("|")
    assert.equal(rows.length, 7, ch + " has 7 rows")
    assert.ok(rows.every((r) => r.length === rows[0].length && /^[.#]+$/.test(r)), ch + " rows are even and only . and #")
  }
  for (const v of Object.values(L.DOT_ALIAS)) assert.ok(L.DOTS[v], "alias target exists: " + v)

  const t = L.layoutText("NOW HIRING!")
  assert.equal(t.w, 55, "NOW HIRING! is 55 columns: it fills the 60-column screen the way the print does")
  assert.equal(t.bits.length, t.w * 7)
  assert.deepEqual(L.layoutText("now"), L.layoutText("NOW"), "lower case is set in capitals")
  assert.deepEqual(L.layoutText("✦"), L.layoutText("*"), "the star has a glyph")
  assert.equal(L.layoutText("").w, 0)
  assert.equal(L.layoutText("€").w, 3, "unknown characters are a blank")
  const i = L.layoutText("I")
  assert.equal(i.w, 3)
  assert.deepEqual([...i.bits.slice(0, 3)], [1, 1, 1], "I's top serif")
}
{
  const cols = 60
  const rows = 19
  const lit = (g, r) => g.slice(r * cols, (r + 1) * cols).some(Boolean)
  const two = L.composeScreen(["WE ARE", "NOW HIRING!"], cols, rows, 0)
  assert.equal(two.overflow, false)
  assert.deepEqual(two.ends, [L.layoutText("WE ARE").w + 1, 56], "where each line stops, for the trail")
  assert.ok(lit(two.grid, 1) && lit(two.grid, 7) && !lit(two.grid, 8) && lit(two.grid, 11) && lit(two.grid, 17))
  assert.ok(!lit(two.grid, 0) && !lit(two.grid, 18), "a dark row above and below")
  assert.equal(two.grid[1 * cols], 0, "lines start one column in")

  const one = L.composeScreen(["HELLO"], cols, rows, 0)
  assert.ok(!lit(one.grid, 5) && lit(one.grid, 6) && lit(one.grid, 12) && !lit(one.grid, 13), "a single line sits in the middle")

  const flush = L.composeScreen(["NIGHT SHIFT"], cols, rows, 0)
  assert.equal(L.layoutText("NIGHT SHIFT").w, 59)
  assert.equal(flush.overflow, false, "a line that needs every column still fits")

  const long = "HIRING ✦ MOTION LEAD ✦ REMOTE OK"
  const m0 = L.composeScreen(["X", long], cols, rows, 0)
  const m5 = L.composeScreen(["X", long], cols, rows, 5)
  assert.equal(m0.overflow, true, "too wide runs as a marquee")
  assert.notDeepEqual(m0.grid, m5.grid, "the marquee moves")
  assert.deepEqual(L.composeScreen(["X", long], cols, rows, L.layoutText(long).w + 8).grid, m0.grid, "and wraps round")
  assert.deepEqual(m0.grid.slice(0, 8 * cols), m5.grid.slice(0, 8 * cols), "only the long line moves")
  assert.equal(L.composeScreen(["A", "B", "C"], cols, rows, 0).ends.length, 2, "two lines at most")
}

// the seven-segment date
{
  const digits = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg" }
  for (const [d, segs] of Object.entries(digits)) {
    const mask = [..."abcdefg"].reduce((m, s, k) => m | (segs.includes(s) ? 1 << k : 0), 0)
    assert.equal(L.SEG[d], mask, "digit " + d)
  }
  const kinds = (t) => L.segCells(t).map((c) => c.kind).join("")
  assert.equal(kinds("09.05-09.15"), "dd.ddddd.dd", "digits and the dash are wide, the dots narrow")
  const sameFootprint = (a, b) => {
    const n = (t, k) => L.segCells(t).filter((c) => (k === "d" ? c.kind === "d" : c.kind !== "d")).length
    return n(a, "d") === n(b, "d") && n(a, ".") === n(b, ".")
  }
  assert.ok(sameFootprint("09.05-09.15", L.countdown(12 * 864e5)), "the countdown takes the dates' cells")
  assert.equal(L.segCells("12d").at(-1).mask, L.SEG.D, "lower case is folded")
  assert.equal(L.segCells("?")[0].mask, 0, "unknown characters are blank")
  const polys = L.segPolys(50, 196, 12, 1.6)
  assert.equal(polys.length, 7)
  for (const p of polys) {
    const pts = p.split(" ").map((xy) => xy.split(",").map(Number))
    assert.equal(pts.length, 6, "hexagonal segments")
    assert.ok(pts.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 50 && y >= 0 && y <= 196), "inside the cell")
  }
}
{
  assert.equal(L.countdown(0), "CLOSED")
  assert.equal(L.countdown(-5), "CLOSED")
  assert.equal(L.countdown(NaN), "CLOSED")
  assert.equal(L.countdown(864e5 + 2 * 36e5 + 3 * 6e4 + 4e3), "01D02:03:04")
  assert.equal(L.countdown(500 * 864e5).slice(0, 3), "99D", "days are clamped to two digits")
  assert.equal(L.parseDeadline("2026-10-14T18:00:00Z"), Date.UTC(2026, 9, 14, 18))
  assert.equal(L.parseDeadline(1234), 1234)
  assert.equal(L.parseDeadline(new Date(99)), 99)
  assert.equal(L.parseDeadline("not a date"), null)
  assert.equal(L.parseDeadline(undefined), null)
  assert.equal(L.parseDeadline(""), null)
}
{
  const r = L.rng(3)
  assert.equal(L.rollAt("09.05-09.15", 1, r), "09.05-09.15", "lands on the date")
  for (const p of [0, 0.3, 0.7]) {
    const s = L.rollAt("09.05-09.15", p, r)
    assert.equal(s.length, 11)
    assert.equal(s.replace(/\d/g, "#"), "##.##-##.##", "only digits roll")
  }
  const early = L.rollAt("12345678", 0.5, () => 0.99)
  assert.equal(early.slice(0, 2), "12", "early digits settle first")
  assert.equal(early.slice(-1), "9", "late ones are still rolling")
}

// cables, the swing, the fluid
{
  const [x, y] = L.rotateAbout(1, 0, 0, 0, Math.PI / 2)
  assert.ok(Math.abs(x) < 1e-12 && Math.abs(y - 1) < 1e-12)
  const pts = [[100, 0, 0], [100, 100, 0.5], [100, 200, 1]]
  assert.deepEqual(L.placeCable(pts, 0, 0, 0), [[100, 0], [100, 100], [100, 200]], "no swing, no change")
  const sw = L.placeCable(pts, 0.2, 0, 0)
  assert.deepEqual(sw[0], [100, 0], "weight 0 stays with the rig")
  const full = L.rotateAbout(100, 200, 0, 0, 0.2)
  assert.ok(Math.abs(sw[2][0] - full[0]) < 1e-9 && Math.abs(sw[2][1] - full[1]) < 1e-9, "weight 1 rides with the panel")
  const half = L.rotateAbout(100, 100, 0, 0, 0.2)
  assert.ok(Math.abs(sw[1][0] - (100 + half[0]) / 2) < 1e-9, "weights between bend the cable")

  const d = L.smoothPath([[0, 0], [10, 20], [30, 25], [40, 0]])
  assert.match(d, /^M0\.0 0\.0(C[-\d. ]+){3}$/, "one cubic per span")
  assert.ok(d.endsWith(" 40.0 0.0"), "ends on the last point")
  assert.ok(d.includes(" 10.0 20.0C"), "passes through every point")
  assert.equal(L.smoothPath([[1, 1]]), "")
}
{
  const s = { a: 0.2, v: 0 }
  for (let i = 0; i < 600; i++) L.swingStep(s, 0, 1 / 60, 15, 1.5)
  assert.ok(Math.abs(s.a) < 0.01, "a released panel settles")
  const over = { a: 0.2, v: 0 }
  let min = 1
  for (let i = 0; i < 60; i++) {
    L.swingStep(over, 0, 1 / 60, 15, 1.5)
    min = Math.min(min, over.a)
  }
  assert.ok(min < -0.05, "and swings through before it does")
  const held = { a: 0, v: 0 }
  for (let i = 0; i < 120; i++) L.swingStep(held, 0.17, 1 / 30, 150, 22)
  assert.ok(Math.abs(held.a - 0.17) < 0.002 && Number.isFinite(held.v), "a held panel follows the hand at the clamped step")
}
{
  const flat = L.fluidSurface(474, 906, 1526, 0, 0, 0)
  assert.ok(flat.split(/[ML]/).filter(Boolean).every((p) => p.split(" ")[1] === "1526.0"), "no amplitude, no slope: flat")
  const tilt = L.fluidSurface(474, 906, 1526, 0.1, 0, 0).split(/[ML]/).filter(Boolean).map((p) => Number(p.split(" ")[1]))
  assert.ok(tilt[0] < 1526 && tilt.at(-1) > 1526, "a slope tilts it about the middle")
  const body = L.fluidPath(474, 906, 1526, 1600, 0.05, 1.3, 2)
  assert.ok(body.startsWith(L.fluidSurface(474, 906, 1526, 0.05, 1.3, 2)) && body.endsWith("L474 1600Z"), "the body closes under the surface")
  assert.doesNotMatch(body, /NaN|Infinity/)
}

// fitting the stage
{
  for (const [W, H] of [[1440, 900], [1920, 700], [1280, 800], [390, 844], [768, 1024], [320, 560]]) {
    const f = L.fitStage(W, H)
    assert.ok(f.s > 0 && Number.isFinite(f.tx) && Number.isFinite(f.ty), "finite at " + W + "x" + H)
    assert.ok((L.VIEW.y1 - L.VIEW.y0) * f.s <= H + 0.5, "the rig fits the height at " + W + "x" + H)
    assert.ok((L.CORE.x1 - L.CORE.x0) * f.s <= W + 0.5, "the panel is never cropped at " + W + "x" + H)
    assert.ok(Math.abs(f.tx + 600 * f.s - W / 2) < 1e-6, "centred at " + W + "x" + H)
  }
  const wide = L.fitStage(1440, 900)
  assert.ok((L.VIEW.x1 - L.VIEW.x0) * wide.s <= 1440, "on a wide screen everything shows")
  const phone = L.fitStage(390, 844)
  assert.ok((L.VIEW.x1 - L.VIEW.x0) * phone.s > 390, "on a phone the capsule's ends may run off")
}

console.log("hiring-rig-poster: ok")
