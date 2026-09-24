// Install-safety and engine checks for components/graffiti-script-preloader and
// components/graffiti-script-landing.
// Run: node tests/graffiti-script.test.mjs
//
// Both files carry the same lettering engine and the same preloader, because
// 21st ships one file per component and the landing page opens with the
// preloader. So the shared regions must stay byte-identical, the glyph math
// must actually produce every capital, and neither file may reach outside
// itself for a font, an image or a stylesheet.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (slug, file = slug + ".tsx") =>
  readFileSync(new URL(`../components/${slug}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")

const PRE = "graffiti-script-preloader"
const LAND = "graffiti-script-landing"
const pre = read(PRE)
const land = read(LAND)

const region = (src, name) => {
  const a = src.indexOf(`// #region ${name}\n`)
  const b = src.indexOf(`// #endregion ${name}\n`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a, b)
}

/* ---------- one engine, two files ---------- */

for (const name of ["graffiti-engine", "graffiti-preloader"]) {
  const x = region(pre, name).split("\n")
  const y = region(land, name).split("\n")
  const i = x.findIndex((line, n) => line !== y[n])
  assert.ok(
    i === -1 && x.length === y.length,
    `${name} has drifted between the two files at line ${i + 1} of the region:\n` +
      `  ${PRE}: ${JSON.stringify(x[i])}\n  ${LAND}: ${JSON.stringify(y[i])}`,
  )
}

/* ---------- nothing travels with it ---------- */

for (const [slug, src] of [[PRE, pre], [LAND, land]]) {
  const where = (m) => `${slug}: ${m}`
  const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(imports, ["react"], where("react is the only import"))
  assert.doesNotMatch(src, /https?:\/\//, where("no external URL anywhere"))
  assert.doesNotMatch(src, /@import|@font-face|<link\b|<img\b|fetch\(|new Image\(/, where("nothing may load at runtime"))
  assert.ok(src.includes('height = "100svh"'), where("height defaults to a definite length"))
  assert.doesNotMatch(src, /\bh-full\b/, where("no h-full"))
  assert.match(src, /React\.useId\(\)/, where("svg ids are namespaced per instance"))
  assert.doesNotMatch(src, /(?:href|mask|clipPath)=["']#|url\(#[a-z]/, where("every svg reference is built from the instance id"))
  assert.ok(src.includes("prefers-reduced-motion:reduce"), where("honours reduced motion"))

  // Every CSS string: no template holes, no url(), no bare resets, and every
  // selector scoped under the component's own prefix.
  const blocks = [...src.matchAll(/const [A-Z_]+_CSS = `([\s\S]*?)`/g)].map((m) => m[1])
  assert.ok(blocks.length >= (slug === LAND ? 3 : 2), where("CSS blocks present"))
  for (const css of blocks) {
    assert.doesNotMatch(css, /\$\{|`/, where("no interpolation inside a CSS string"))
    assert.doesNotMatch(css, /url\(/, where("no url() in the style block"))
    for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
      const sel = m[1].trim()
      if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
      for (const s of sel.split(",")) {
        assert.match(s.trim(), /^\.gs[xl]-/, where(`selector escapes the component: ${s.trim()}`))
      }
    }
  }
  // Preflight caps svg widths inside flex rows; every sized svg opts out.
  for (const css of blocks) {
    for (const m of css.matchAll(/([^{}]*svg[^{}]*)\{([^}]*)\}/g)) {
      if (/width:/.test(m[2])) assert.match(m[2], /max-width:none/, where(`svg rule exposed to Preflight: ${m[1].trim()}`))
    }
  }
}

/* ---------- the preloader ---------- */

assert.match(pre, /role="progressbar"/, "the gate reports progress to assistive tech")
assert.match(pre, /aria-valuenow=\{count\}/, "progress value is live")
assert.match(pre, /\.gsx-root\[data-stage="exit"\] \.gsx-scene\{animation:gsx-iris/, "the exit is the iris")
assert.match(pre, /\{reveal && <div className="gsx-dest">\{children\}<\/div>\}/, "children mount behind the gate")
assert.match(pre, /if \(loop\) \{/, "loop restarts instead of revealing")
assert.match(pre, /doneRef\.current\?\.\(\)/, "onComplete fires when the iris closes")
const preDemo = read(PRE, "demo.tsx")
assert.match(preDemo, /<GraffitiScriptPreloader loop \/>/, "default demo loops the full sequence")
assert.doesNotMatch(preDemo, /<div/, "default demo is the component, full bleed")

/* ---------- the landing ---------- */

assert.match(land, /<GraffitiScriptPreloader\n\s+key=\{run\}/, "the landing opens with the preloader and can replay it")
assert.match(land, /<h1 className="gsl-sr">\{heading\}<\/h1>/, "the drawn headline has real text for readers")
assert.match(land, /aria-pressed=\{c === ink\}/, "ink swatches expose their state")
assert.match(land, /onKeyDown=\{\(e\) => \{\n\s+if \(e\.key === "Enter"\) commit\(\)\n\s+if \(e\.key === "Escape"\) setDraft\(null\)/, "Enter inks, Escape cancels")
assert.match(land, /\.gsl-input\{[^}]*font-size:16px/, "the hidden input is 16px so iOS does not zoom on focus")
assert.match(land, /closest\("button,a,input,\.gsl-title"\)/, "sparkle bursts never steal a control's click")
assert.match(land, /@container \(max-width:720px\)\{/, "the poster re-flows for phones")
for (const t of ["intro={false}"]) assert.ok(read(LAND, "demo-no-intro.tsx").includes(t), "a demo shows the page without the intro")

/* ---------- the glyph math, executed ---------- */

const math = region(pre, "glyph-math") + "\nexport { GLYPHS, glyph, layoutLines, ribbon, toCubics, arcCubics }\n"
const js = stripTypeScriptTypes(math)
const E = await import("data:text/javascript," + encodeURIComponent(js))

const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
assert.deepEqual(Object.keys(E.GLYPHS).sort().join(""), AZ, "exactly A–Z are drawn")
for (const ch of AZ) {
  const g = E.glyph(ch)
  assert.ok(g, `${ch} builds`)
  assert.doesNotMatch(g.d, /NaN|Infinity/, `${ch} outline is finite`)
  assert.equal(g.strokes.length, g.spines.length, `${ch} has a spine per stroke (the draw-in masks follow them)`)
  const [x0, y0, x1, y1] = g.box
  assert.ok(y0 < 12 && y1 > 94, `${ch} spans the cap height (${y0.toFixed(1)}…${y1.toFixed(1)})`)
  assert.ok(x1 - x0 > 50 && x1 - x0 < 190, `${ch} has a sane width (${(x1 - x0).toFixed(1)})`)
  assert.ok(y1 - y0 < 170, `${ch} has a sane height`)
  assert.equal(E.glyph(ch), g, `${ch} is cached`)
}
assert.equal(E.glyph("7"), null, "unknown characters are skipped, not drawn")

const L = E.layoutLines(["Nova", "Legends"])
assert.equal(L.items.length, 11, "two lines, eleven letters")
assert.ok(L.items.slice(4).every((p) => p.y > 60), "second line sits below the first")
const cx = (L.box[0] + L.box[2]) / 2
assert.ok(Math.abs(cx) < 60, "lines are centred on a shared axis")
assert.deepEqual(E.layoutLines(["", "  "]).items, [], "blank lines lay out nothing")
assert.deepEqual(E.layoutLines(["123"]).box, [0, 0, 100, 100], "an all-unknown line still has a box")
const again = E.layoutLines(["Nova", "Legends"])
assert.deepEqual(again.items.map((p) => [p.x, p.y, p.r]), L.items.map((p) => [p.x, p.y, p.r]), "layout is deterministic")

const ring = E.arcCubics(100, 40, 0, Math.PI * 2)
assert.equal(ring.length, 8, "a full ring is eight 45° arcs")
assert.ok(Math.hypot(ring[7][3][0] - 100, ring[7][3][1]) < 1e-6, "the ring closes on itself")

/* ---------- the headline splitter, executed ---------- */

const split = region(land, "split-title") + "\nexport { splitTitle }\n"
const { splitTitle } = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(split)))
assert.deepEqual(splitTitle("Nova Legends"), ["NOVA", "LEGENDS"])
assert.deepEqual(splitTitle("wild style kings"), ["WILD", "STYLE KINGS"])
assert.deepEqual(splitTitle("a / b / c / d"), ["A", "B", "C"], "slashes are explicit breaks, three lines max")
assert.deepEqual(splitTitle("hi!!"), ["HI"], "punctuation is dropped")
assert.deepEqual(splitTitle("  "), [], "blank input keeps the old headline")
assert.deepEqual(splitTitle("Graffiti"), ["GRAFFITI"], "one word stays one line")

console.log("graffiti-script: ok (engine shared, A–Z built, layout + splitter executed)")
