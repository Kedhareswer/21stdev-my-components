// Install-safety and drift check for the bubble-graffiti pair:
// components/bubble-graffiti-preloader and components/bubble-graffiti-landing.
// Run: node tests/bubble-graffiti.test.mjs
//
// The two share one engine — the balloon alphabet, the hero drawing and the
// intro — pasted into both files between `// #region bubble-kit` markers,
// because 21st ships one file per component. The landing's intro is meant to
// end on exactly the frame the landing starts on, so the copies must not
// drift. The alphabet itself is lifted out and executed.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (slug, file) => readFileSync(new URL(`../components/${slug}/${file}`, import.meta.url), "utf8")
const PRE = "bubble-graffiti-preloader"
const LAND = "bubble-graffiti-landing"
const pre = read(PRE, PRE + ".tsx")
const land = read(LAND, LAND + ".tsx")

const region = (src, name) => {
  const a = src.indexOf(`// #region ${name}`)
  const b = src.indexOf(`// #endregion ${name}`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a, b)
}

/* ---------- the shared engine has not drifted ---------- */

const kit = region(pre, "bubble-kit")
assert.equal(region(land, "bubble-kit"), kit, "bubble-kit differs between the preloader and the landing — edit both or neither")
assert.ok(kit.length > 20000, "could not lift the kit")

/* ---------- nothing travels with it ---------- */

const cssOf = (src, name) => {
  const m = src.match(new RegExp(`const ${name} = \`([\\s\\S]*?)\``))
  assert.ok(m, `${name} block missing`)
  return m[1]
}
const blocks = [
  ["KIT_CSS", cssOf(pre, "KIT_CSS"), ".bgk-"],
  ["LANDING_CSS", cssOf(land, "LANDING_CSS"), ".bgl-"],
]

for (const [slug, src] of [[PRE, pre], [LAND, land]]) {
  const where = (m) => `${slug}: ${m}`
  const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(imports, ["react"], where("react is the only import"))
  assert.doesNotMatch(src, /https?:\/\//, where("no external URL — everything is drawn"))
  assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(|<img\b/, where("nothing may load at runtime"))
  assert.match(src, /height = "100svh"/, where("height must default to a definite length"))
  assert.doesNotMatch(src, /\bh-full\b/, where("no h-full"))
  assert.match(src, /^export default function /m, where("default export"))
}

for (const [name, css, prefix] of blocks) {
  assert.doesNotMatch(css, /[`]|\$\{/, `${name}: no backticks or template holes`)
  assert.doesNotMatch(css, /url\(|@import/, `${name}: no url() or @import`)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\{/, `${name}: honours reduced motion`)
  // Every selector must be scoped, or it leaks into the installer's app.
  const flat = css.replace(/@(media|container)[^{]*\{/g, "").replace(/@keyframes [\w-]+\{(?:[^{}]*\{[^}]*\})*[^{}]*\}/g, "")
  for (const m of flat.matchAll(/(?:^|\})\s*([^{}@]+?)\s*\{/g)) {
    for (const sel of m[1].split(",")) {
      const s = sel.trim().replace(/^(button|a|svg)(?=\.)/, "")
      if (s) assert.ok(s.startsWith(prefix), `${name}: unscoped selector ${sel.trim()}`)
    }
  }
}

const KIT_CSS = blocks[0][1]
const LANDING_CSS = blocks[1][1]

// Preflight caps svg/img width; every drawing here is absolutely placed.
assert.match(KIT_CSS, /\.bgk-root svg\{max-width:none/, "svg must opt out of Preflight's max-width")

// The root takes its height from the prop; container units size everything
// inside off the component, not the viewport.
assert.match(KIT_CSS, /\.bgk-root\{[^}]*container-type:size/, "root must be a size container")
assert.doesNotMatch(KIT_CSS.match(/\.bgk-root\{[^}]*\}/)[0], /[;{]height:/, "root height comes from the prop")

// The drawing covers the hero, so only the playable parts may take the pointer.
assert.match(KIT_CSS, /\.bgk-art\{[^}]*pointer-events:none/, "the art box must not swallow clicks")
assert.match(KIT_CSS, /\.bgk-l,\.bgk-star,\.bgk-px rect,\.bgk-cloud\{pointer-events:auto\}/, "letters, star, pixels and cloud are playable")
// Dragging needs touch-action:none — on the letters only, so a phone can still scroll the page.
assert.match(KIT_CSS, /\.bgk-l\{[^}]*touch-action:none/, "letters must opt out of touch panning")
assert.doesNotMatch(KIT_CSS.match(/\.bgk-root\{[^}]*\}/)[0], /touch-action/, "root must still scroll")
assert.match(kit, /setPointerCapture\(e\.pointerId\)/, "a dragged letter must capture the pointer")

// Entrance animations must not hold their end frame, or hover transforms on
// the same element stop working once the intro has played.
for (const cls of ["bgk-px rect", "bgk-cloud", "bgk-star-in", "bgk-slab", "bgk-in"]) {
  const rule = KIT_CSS.match(new RegExp(`\\n\\.${cls.replace(" ", "\\s")}\\{([^}]*)\\}`))
  assert.ok(rule, `rule for .${cls} missing`)
  assert.match(rule[1], /backwards/, `.${cls} entrance must use fill-mode backwards`)
}

// Reduced motion: the storm and the marquee are removed, everything else lands on its end frame.
const reduced = KIT_CSS.slice(KIT_CSS.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(reduced, /\.bgk-storm,\.bgk-rows\{display:none\}/, "reduced motion drops the letter storm")
assert.match(kit, /useReducedMotion\(\)/, "SMIL morphs are gated in JS; CSS cannot stop them")
assert.match(LANDING_CSS, /@media \(prefers-reduced-motion: reduce\)\{[\s\S]*\.bgl-d1,\.bgl-d2,\.bgl-d3\{transform:none\}/, "reduced motion drops parallax")

/* ---------- the preloader ---------- */

assert.match(kit, /role="progressbar"/, "progress must be reported to assistive tech")
assert.match(kit, /aria-valuenow/, "progressbar must carry a value")
assert.match(kit, /const later = [^\n]*timers\.current\.push/, "wipe timers are tracked")
assert.match(kit, /timers\.current\.forEach\(\(t\) => clearTimeout\(t\)\)/, "wipe timers are cleared on unmount")
// The counter runs every frame; writing it through React would re-render the whole storm.
assert.match(kit, /numRef\.current\.textContent = /, "the counter is written to the DOM, not state")
assert.match(pre, /return <BubbleIntro \{\.\.\.props\} \/>/, "the preloader is the shared intro, unmodified")

/* ---------- the landing ---------- */

assert.match(land, /<BubbleIntro\s+fill/, "the landing opens with the shared intro")
assert.match(land, /onReveal=\{\(\) => setStage\("reveal"\)\}/, "the landing mounts under the wipe, not after it")
assert.match(land, /role="search"/, "search is a landmark")
assert.match(land, /aria-expanded=\{open\}/, "the menu button reports its state")
assert.match(land, /e\.key === "Escape"/, "Escape closes the menu")
assert.match(land, /<h1 className="bgl-sr">/, "the page has a real heading behind the drawing")

/* ---------- the balloon alphabet, executed ---------- */

const glyphJs = stripTypeScriptTypes(region(pre, "glyphs")) +
  "\nexport { GLYPHS, glyphFor, ends, layoutWord, loadCurve, TUBE }"
const { GLYPHS, glyphFor, ends, layoutWord, loadCurve, TUBE } = await import(
  "data:text/javascript," + encodeURIComponent(glyphJs)
)

for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.- ") {
  assert.ok(GLYPHS[ch], `glyph ${JSON.stringify(ch)} missing`)
}
for (const [ch, g] of Object.entries(GLYPHS)) {
  for (const d of g.d) {
    assert.match(d, /^M-?\d+ -?\d+( [LQ]-?\d+ -?\d+( -?\d+ -?\d+)?)+$/, `glyph ${ch}: unexpected path syntax ${d}`)
    const nums = d.match(/-?\d+/g).map(Number)
    for (let i = 0; i < nums.length; i += 2) {
      // Centre-lines stay inside the box less the tube's radius, so a fat
      // letter never pokes out of its advance width.
      assert.ok(nums[i] >= TUBE / 2 - 4 && nums[i] <= g.w - TUBE / 2 + 12, `glyph ${ch}: x ${nums[i]} outside its box`)
      assert.ok(nums[i + 1] >= 8 && nums[i + 1] <= 92, `glyph ${ch}: y ${nums[i + 1]} outside the cap height`)
    }
    assert.equal(ends(d).length, 4, `glyph ${ch}: ends() must find both knots`)
  }
}
assert.equal(glyphFor("q"), GLYPHS.Q, "lower case is set as capitals")
assert.equal(glyphFor("@"), GLYPHS[" "], "unknown characters become a space")

const a = layoutWord("hello", 42, 1, -7)
const b = layoutWord("hello", 42, 1, -7)
assert.deepEqual(a, b, "layout must be deterministic — it runs during render")
assert.equal(a.letters.length, 5)
assert.ok(a.width > 250 && a.width < 450, `unexpected word width ${a.width}`)

let prev = 0
for (let i = 0; i <= 200; i++) {
  const v = loadCurve(i / 200)
  assert.ok(v >= prev - 1e-9, `loadCurve must never run backwards (at ${i / 200})`)
  prev = v
}
assert.equal(loadCurve(0), 0)
assert.ok(Math.abs(loadCurve(1) - 1) < 1e-9, "loadCurve must reach 1")

/* ---------- demos ---------- */

for (const [slug, files] of [[PRE, ["demo.tsx", "demo-reveal.tsx"]], [LAND, ["demo.tsx", "demo-night.tsx"]]]) {
  for (const f of files) {
    const demo = read(slug, f)
    const imports = [...demo.matchAll(/from ["']([^"']+)["']/g)].map((m) => m[1])
    assert.deepEqual(imports, [`@/components/ui/${slug}`], `${slug}/${f}: imports only the component`)
    assert.doesNotMatch(demo, /https?:\/\//, `${slug}/${f}: no external assets`)
  }
}
assert.match(read(PRE, "demo.tsx"), /<BubbleGraffitiPreloader loop \/>/, "the cover demo loops")

console.log("ok - bubble-graffiti")
