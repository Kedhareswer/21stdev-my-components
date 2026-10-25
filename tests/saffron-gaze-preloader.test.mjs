// Install-safety, type, eye, painting and layout checks for saffron-gaze-preloader.
// Run: node tests/saffron-gaze-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/saffron-gaze-preloader/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("saffron-gaze-preloader.tsx")
const demos = Object.fromEntries(["demo", "demo-gate", "demo-moonlit"].map((n) => [n, read(n + ".tsx")]))

// ---- 1. Install safety -----------------------------------------------------
assert.deepEqual(
  readdirSync(dir).sort(),
  ["README.md", "demo-gate.tsx", "demo-moonlit.tsx", "demo.tsx", "saffron-gaze-preloader.tsx"],
  "the folder ships the component, its demos and a README, nothing else",
)
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /https?:\/\//, "no external assets: the capture sandbox blocks other origins")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"') && src.includes("aria-valuenow={pct}"), "reports progress")
assert.ok(src.includes('toggleAttribute("inert"'), "the guarded page cannot take focus under the gate")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/, "effects must not depend on onComplete identity")
assert.ok(src.includes("cancelAnimationFrame(raf)"), "the frame loop is torn down on unmount")
assert.ok(src.includes("ro.disconnect()"), "the resize observer is torn down")
assert.ok(src.includes("timers.forEach("), "exit timers are torn down")
assert.ok(src.includes("React.useId()"), "SVG ids are unique per instance")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "no generic hook type arguments (the 21st CLI tokenizer hangs on them)")
const generic = src.slice(0, src.indexOf("</")).match(/Partial<|Record<|ReturnType<|Array<|Map<|React\.[A-Za-z]+<|\[K in /)
assert.equal(generic, null, "no generics before the first JSX close tag: " + (generic && generic[0]))

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const SGZ_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "SGZ_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.match(css, /\.sgz-root svg, \.sgz-root img \{[^}]*max-width: none/, "SVGs and images override Preflight's max-width")
let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".sgz-")), `unscoped CSS selector would leak into the host app: ${sel}`)
}
assert.ok(rules >= 40, `expected a full scoped sheet, saw ${rules} rules`)
for (const phase of ["intro", "awaken", "hold"]) assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
for (const step of ["slit", "line", "part", "shrink"]) assert.ok(css.includes(`[data-step="${step}"]`), `exit step ${step} is styled`)
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.ok(reduced.includes(".sgz-panel") && reduced.includes("transform: none !important"), "nothing travels under reduced motion")
// a CSS transform overrides an SVG transform attribute: animated classes must not carry one
for (const cls of ["sgz-spark", "sgz-moon", "sgz-shine", "sgz-curl", "sgz-halo", "sgz-rays"]) {
  const re = new RegExp('className="[^"]*\\b' + cls + '\\b[^"]*"[^>]*\\stransform=', "s")
  for (const m of src.matchAll(new RegExp("<[a-z]+[^<>]*className=\"[^\"]*\\b" + cls + "\\b[^\"]*\"[^<>]*>", "g"))) {
    assert.doesNotMatch(m[0], /\stransform=/, `.${cls} must not carry a transform attribute: ${m[0].slice(0, 80)}`)
  }
  void re
}

// ---- 3. Geometry, executed -------------------------------------------------
const start = src.indexOf("// #region geometry")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "geometry region markers missing")
const m = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// the display face
for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-!'/ ") {
  const g = m.SGZ_GLYPHS[ch]
  assert.ok(g, `glyph ${JSON.stringify(ch)} exists`)
  assert.ok(g[0] > 0, `${ch} has an advance`)
  if (ch === " ") continue
  for (const v of g[1].match(/-?\d*\.?\d+/g).map(Number)) assert.ok(v >= 0 && v <= 100, `${ch}: ${v} inside the 100-unit box`)
}
assert.equal(m.sgzGlyph("é"), m.SGZ_GLYPHS.E, "accents drop")
assert.equal(m.sgzGlyph("r"), m.SGZ_GLYPHS.R, "lower case lifts")
assert.equal(m.sgzGlyph("#"), m.SGZ_GLYPHS[" "], "unknown characters are spaces")
const word = m.sgzWord("AB", 7)
assert.equal(word.width, m.SGZ_GLYPHS.A[0] + 7 + m.SGZ_GLYPHS.B[0], "a word is its advances plus tracking between letters")
assert.equal(word.letters[1].x, m.SGZ_GLYPHS.A[0] + 7 + 5, "letters keep their side bearing")

// the simulated load surges and stalls but never runs backwards
assert.equal(m.sgzSimulated(-1), 0)
assert.equal(m.sgzSimulated(2), 1)
let prev = 0
for (let i = 1; i <= 400; i++) {
  const v = m.sgzSimulated(i / 400)
  assert.ok(v >= prev - 1e-9 && v <= 1, `simulated progress never runs backwards (t=${i / 400})`)
  prev = v
}
assert.ok(m.sgzSimulated(0.32) - m.sgzSimulated(0.2) < 0.05, "the first stall is present")

// the eye opens and shuts
const lidMid = (o) => m.sgzUpper(o)[1][1] + m.sgzUpper(o)[2][1]
assert.ok(lidMid(1) < lidMid(0.5) && lidMid(0.5) < lidMid(0), "the upper lid rises as the eye opens")
assert.ok(lidMid(0) > 0, "shut, the lid sits below the corners, like a closed painted eye")
assert.match(m.sgzEyeD(0.4), /^M[-\d. ]+ C[-\d. ]+ C[-\d. ]+ Z$/, "the aperture is two curves, closed")
assert.equal(m.sgzLashes(1, 24, 7).length, 24, "one lash per count")
assert.deepEqual(m.sgzLashes(0.3, 12, 7), m.sgzLashes(0.3, 12, 7), "lashes are deterministic per seed")
assert.match(m.sgzKajalD(1, 1), /^M[-\d. L]+ Z$/, "kajal is a closed shape")

// marks
const moon = m.sgzMoonD(10)
assert.equal((moon.match(/A/g) || []).length, 2, "the crescent is two arcs")
const [mx, my] = moon.slice(1).split(" ").map(Number)
assert.ok(Math.abs(Math.hypot(mx, my) - 10) < 0.01, "the crescent's tips sit on the outer circle")
assert.ok(Math.abs(Math.hypot(mx - 5, my) - 9) < 0.01, "and on the bite")
assert.match(m.sgzSparkleD(4), /^M0 -4 C/, "a sparkle starts at its top point")

// the painting
const W = 1440
const H = 900
const lay = m.sgzLayout(W, H, 450, 300)
const tone = (x, y) => m.sgzSkinTone(x, y, lay)
for (let i = 0; i < 400; i++) {
  const x = (i * 37.3) % lay.win.w
  const y = (i * 19.7) % lay.win.h
  const t = tone(x, y)
  assert.ok(t >= 0 && t <= 1, "tone stays in [0, 1]")
  assert.ok(Number.isFinite(m.sgzFlow(x, y, lay)), "the brush always has a direction")
}
assert.ok(tone(lay.lx, lay.eyeY) < tone(lay.lx, lay.eyeY + lay.a * 1.08), "the socket is darker than the cheekbone")
assert.ok(tone(lay.win.w / 2, lay.sun.y + lay.sun.r) > tone(4, lay.win.h / 2), "the forehead is lit, the edge is in shadow")
assert.ok(Math.abs(tone(lay.lx - 30, 200) - tone(lay.rx + 30, 200)) < 1e-9, "the face is symmetric")
const fil = m.sgzFiligreeD().match(/-?\d*\.?\d+/g).map(Number)
assert.ok(fil.length > 150, "the filigree is a long, smooth line")

// clouds
const c1 = m.sgzCloud(11, 400, 140)
assert.deepEqual(c1, m.sgzCloud(11, 400, 140), "clouds are deterministic per seed")
assert.ok(c1.puffs.length >= 8, "a cumulus has a body of lobes")
assert.ok(c1.puffs.every((p) => p.r > 0 && p.y - p.r >= c1.box[1] - 1e-9 && p.x + p.r <= c1.box[2] + 1e-9), "the box holds every lobe")

// the poster, laid out across boxes
for (const [w, h] of [[1440, 900], [1280, 800], [1920, 1080], [2560, 1080], [768, 1024], [390, 844], [375, 667], [320, 568]]) {
  const L = m.sgzLayout(w, h, 520, 320)
  const at = `${w}×${h}`
  assert.ok(L.win.x >= 0 && L.win.x + L.win.w <= w, `${at}: the window fits across`)
  assert.ok(L.win.y > 0 && L.win.y + L.win.h < h * 0.6, `${at}: the window sits in the upper part`)
  assert.ok(L.title.y > L.win.y + L.win.h, `${at}: the title is under the window`)
  assert.ok((520 * L.title.h) / 100 <= w * 0.84 + 1e-6 || L.title.h === 28, `${at}: the title never runs past the stage`)
  assert.ok(L.cap.y + 40 < h, `${at}: the caption is on screen`)
  for (const cx of [L.lx, L.rx]) {
    assert.ok(cx - L.a > 0 && cx + L.a < L.win.w, `${at}: both eyes are inside the window`)
  }
  assert.ok(L.rx - L.lx > 2 * L.a, `${at}: the eyes do not overlap`)
  assert.ok(L.sun.y - L.sun.r > 0 && L.sun.y < L.eyeY - L.a * 0.8, `${at}: the sun sits on the forehead`)
  assert.ok(L.moon.x + L.moon.r < L.win.w && L.moon.y + L.moon.r < L.win.h, `${at}: the moon is inside the window`)
  assert.equal(L.portrait, w < h * 1.05, `${at}: portrait is chosen by aspect`)
  for (const c of L.clouds) assert.ok(c.at >= 0 && c.at < 1, `${at}: every cloud arrives during the load`)
}

// ---- 4. Demos ---------------------------------------------------------------
for (const [name, d] of Object.entries(demos)) {
  assert.ok(d.includes('from "@/components/ui/saffron-gaze-preloader"'), `${name} imports the canonical path`)
}
assert.match(demos.demo, /<SaffronGazePreloader loop \/>/, "default demo is the looping component, full bleed")
assert.doesNotMatch(demos.demo, /<div/, "default demo must not wrap the component")
assert.ok(demos["demo-gate"].includes("</SaffronGazePreloader>"), "gate demo passes children")
assert.ok(demos["demo-moonlit"].includes("palette={{"), "moonlit demo shows a second palette")

console.log("saffron-gaze-preloader: ok")
