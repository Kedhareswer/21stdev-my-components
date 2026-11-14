// Runnable check for components/bunkum-studio-template: the stretchy wordmark geometry,
// the springs, Gerald's pendulum (and the let-go easter egg), the archive pan, and the
// install-safety rules.
// Run: node tests/bunkum-studio-template.test.mjs
//
// What breaks silently here: a glyph that turns to NaN when a letter is squashed, a spring
// that explodes on a slow frame, or an archive pan that runs out of scraps before the end.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "bunkum-studio-template"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 800_000, "pictures stay compressed: " + statSync(file).size)

const imgKeys = new Set([...src.matchAll(/^  "([a-z]\d)": "data:image\/webp;base64,/gm)].map((m) => m[1]))
for (const k of ["a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "s0", "s1", "s2", "s3"]) assert.ok(imgKeys.has(k), "embedded picture: " + k)
for (const [, k] of src.matchAll(/bg\("([a-z]\d)"\)|IMG\.([a-z]\d)/g)) if (k) assert.ok(imgKeys.has(k), "referenced picture exists: " + k)

const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
const templates = JSON.parse(readFileSync(new URL("../scripts/templates.json", import.meta.url), "utf8"))
assert.ok(templates.templates.some((t) => t.slug === slug), "listed as a template")
assert.match(demo, /from "@\/components\/ui\/bunkum-studio-template"/, "demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /var\(--color-/, "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, [], "fetches nothing: pictures and fonts are embedded")
assert.equal((src.match(/@font-face\{font-family:Bkm(Sans|Mono)/g) || []).length, 3, "three embedded, renamed font subsets")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /\(hover: hover\) and \(pointer: fine\)/, "fine-pointer gate is read at runtime")
assert.match(src, /ev\.pointerType !== "mouse"/, "touch never drives the cursor, magnets or the stretch")
assert.match(src, /const pointing = \(st\.over && st\.fine\) \|\| st\.touching/, "the letters follow a fine pointer, or a finger while it's down")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*(\/\*[^*]*\*\/\s*\n\s*)?"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{\.bkm-cursor\{display:block\}\}/, "the context label only exists where a mouse can hover")
assert.match(css, /\.bkm-cursor\{display:none/, "and is hidden everywhere else")
assert.match(css, /\.bkm-root svg,\.bkm-root img\{max-width:none\}/, "guards Preflight's img/svg max-width")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((x) => /^(\.dark )?\.bkm-/.test(x.trim())),
    "unscoped selector: " + sel,
  )
}
assert.ok(rules >= 100, "the scope check saw real rules, saw " + rules)

// layout reads: one per frame (the root's box); the rest on resize, magnet enter, or a nav click
const loopAt = src.indexOf("const frame = (now: number) =>")
const loop = src.slice(loopAt, src.indexOf("const schedule = ()", loopAt))
assert.equal((loop.match(/getBoundingClientRect/g) || []).length, 1, "the frame reads layout exactly once")
assert.doesNotMatch(loop, /offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|innerWidth|innerHeight/, "and nothing else")
assert.equal((src.match(/getBoundingClientRect/g) || []).length, 3, "frame, magnet enter, nav jump")

// ---- the story -----------------------------------------------------------
// The constants below were measured on the reference's live preview (headless Chrome, 1440x900):
// letter rest 387px -> max 732px, full pull within 0.139W of a letter, none past 0.462W, linear;
// exponential ease tau ~105ms with no overshoot; the carton turns 175deg per unit pointer offset,
// tau ~300ms, and idles round Y at 6deg/s.
const S = await liftRegion(src, "story")

assert.equal(S.progressFrom(0, 2000, 1000), 0)
assert.equal(S.progressFrom(-1000, 2000, 1000), 1)
assert.equal(S.progressFrom(-10, 800, 1000), 0, "no travel, no progress, never NaN")
assert.equal(S.stageTopAt(300, 2000, 1000), 300, "before it pins")
assert.equal(S.stageTopAt(-500, 2000, 1000), 0, "pinned")
assert.equal(S.stageTopAt(-1400, 2000, 1000), -400, "and released")

// measured motion constants
assert.equal(S.STRETCH, 1.89)
assert.equal(S.TAU_LETTER, 105)
assert.deepEqual([S.NEAR, S.FAR], [0.139, 0.462])
assert.deepEqual([S.LOOK, S.TAU_LOOK, S.SPIN], [175, 300, 6])
// the falloff reproduces the reference's samples (pull at distance d, W = 1440)
for (const [d, want] of [[35, 1], [200, 1], [314, 0.76], [368, 0.64], [426, 0.52], [540, 0.27], [593, 0.16], [700, 0]]) {
  assert.ok(Math.abs(S.pullAt(d, 1440) - want) < 0.05, "pull at " + d + ": " + S.pullAt(d, 1440).toFixed(2) + " vs " + want)
}
assert.equal(S.pullAt(-300, 1440), S.pullAt(300, 1440), "symmetric")
// the ease: 51% at 75ms, 89% at 230ms on the reference
assert.ok(Math.abs(S.approach(0, 1, 75, S.TAU_LETTER) - 0.51) < 0.04)
assert.ok(Math.abs(S.approach(0, 1, 230, S.TAU_LETTER) - 0.89) < 0.03)
assert.ok(Math.abs(S.approach(0, 1, 156, S.TAU_LOOK) - 0.41) < 0.04, "carton: 41% at 156ms")
// rest height: 43% of the stage
const sc = 1404 / S.VB_W
assert.ok(Math.abs(S.baseFor(900, sc) * sc - 387) < 3, "rest letters 387px tall on a 900px stage")
assert.ok(S.vbH(200) >= 200 * S.STRETCH, "the viewBox has room for a full stretch")

// glyphs: every letter at rest, stretched and absurdly squashed is a finite path
for (const base of [120, 163, 280, 600]) {
  for (let i = 0; i < S.WORD.length; i++) {
    for (const h of [base * 0.3, base, base * S.STRETCH, base * 4]) {
      const d = S.glyph(S.WORD[i], S.cellX(i), S.CELLS[i], h, base)
      assert.ok(d.length > 10, S.WORD[i] + " draws")
      assert.doesNotMatch(d, /NaN|Infinity|-?\d+\.\d{2,}/, S.WORD[i] + " is finite and tidy: " + d)
      const ys = [...d.matchAll(/[ML][\d.]+ ([\d.-]+)|V([\d.-]+)/g)].map((m) => +(m[1] ?? m[2]))
      assert.ok(Math.max(...ys) <= Math.max(h, base) + 0.05 && Math.min(...ys) >= -S.T, S.WORD[i] + " stays inside its box (the K arm may run past the top; the clip squares it)")
    }
  }
}
// only the stems grow: B's upper bowl is identical at rest and stretched
assert.equal(S.glyph("B", 0, 96, 163, 163).split("M")[2], S.glyph("B", 0, 96, 300, 163).split("M")[2])
for (let i = 1; i < S.WORD.length; i++) assert.ok(S.cellX(i) >= S.cellX(i - 1) + S.CELLS[i - 1], "cells don't overlap")
assert.ok(S.cellX(5) + S.CELLS[5] <= S.VB_W, "the M fits")

// targets: rest without a pointer, a bump under it
const centres = S.WORD.map((_, i) => 18 + S.cellMid(i) * sc)
const out = []
S.stretchTargets(null, centres, 1440, 163, out)
assert.ok(out.every((h) => h === 163), "nobody pointing: everything rests")
S.stretchTargets(centres[0], centres, 1440, 163, out)
assert.ok(Math.abs(out[0] - 163 * 1.89) < 1e-6 && out[5] === 163, "full under the pointer, rest far away")
for (let i = 1; i < 6; i++) assert.ok(out[i] <= out[i - 1] + 1e-9, "falls away monotonically")

// the carton's look-at
assert.deepEqual(S.lookAt(0, 0), { rx: -0, ry: 0 })
const lk = S.lookAt(-0.72, -0.56)
assert.ok(Math.abs(lk.rx - 98) < 1e-6 && Math.abs(lk.ry + 126) < 1e-6, "pointer at (200,200) on 1440x900 aims where the reference converged")
assert.deepEqual(S.lookAt(3, -3), { rx: 175, ry: 175 }, "clamped")

// Gerald swings and comes to rest; the fifth poke makes him let go
let a = 1.2, w = 0
for (let k = 0; k < 900; k++) [a, w] = S.pendulum(a, w, 16)
assert.ok(Math.abs(a) < 0.02, "the pendulum comes to rest: " + a)
assert.deepEqual([1, 2, 3, 4, 5, 6, 10].map(S.letsGo), [false, false, false, false, true, false, true])

// themes cycle and come back round
assert.ok(S.THEMES.length >= 3)
let t = 0
for (let k = 0; k < S.THEMES.length; k++) t = S.nextTheme(t)
assert.equal(t, 0)
for (const th of S.THEMES) assert.match(th.bg + th.fg + th.deep, /^(#[0-9a-f]{6}){3}$/)

// archive grid: wraps forever, picks neighbour-varied pictures, pans only after the preview
assert.equal(S.wrap(-10, 100), 90)
assert.equal(S.wrap(250, 100), 50)
assert.equal(S.wrap(5, 0), 0, "never NaN")
assert.ok(Math.abs(S.pitchFor(1440) - 1440 / 13.5) < 1e-9, "13.5 columns on a desktop, as measured")
assert.equal(S.ROW, 1.75)
for (let r = -3; r < 6; r++)
  for (let c = -3; c < 8; c++) {
    const k = S.cellKind(c, r, 18)
    assert.ok(k >= 0 && k < 18)
    assert.notEqual(k, S.cellKind(c + 1, r, 18), "no twins side by side")
  }
assert.equal(S.gridPanAt(0), 0)
assert.equal(S.gridPanAt(S.GRID_AT), 0, "the grid holds still until the preview has gone")
assert.ok(S.gridPanAt(1) > 10, "and pans many rows by the end")

console.log("bunkum-studio-template: ok")
