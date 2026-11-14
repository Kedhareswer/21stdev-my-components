// Runnable check for components/bunkum-wordmark-hero: the stretchy wordmark geometry, the
// springs, Gerald's pendulum (and the let-go easter egg), the themes, and the install-safety rules.
// Run: node tests/bunkum-wordmark-hero.test.mjs
//
// What breaks silently here: a glyph that turns to NaN when a letter is squashed, a spring that
// explodes on a slow frame, or a carton face whose picture was left out of the trimmed IMG map.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "bunkum-wordmark-hero"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 400_000, "only the hero's pictures are embedded: " + statSync(file).size)

// exactly the pictures the hero shows, and every one it references exists
const imgKeys = [...src.matchAll(/^  "([a-z]\d)": "data:image\/webp;base64,/gm)].map((m) => m[1]).sort()
assert.deepEqual(imgKeys, ["a1", "a2", "a4", "b1", "b3", "b8", "s0", "s1", "s2"], "carton faces + three stickers, nothing else")
const box = src.match(/const BOX = \[([^\]]+)\]/)
assert.ok(box, "BOX list")
for (const [, k] of box[1].matchAll(/"([a-z]\d)"/g)) assert.ok(imgKeys.includes(k), "carton face exists: " + k)
for (const [, k] of src.matchAll(/IMG\.([a-z]\d)/g)) assert.ok(imgKeys.includes(k), "referenced sticker exists: " + k)

assert.match(demo, /from "@\/components\/ui\/bunkum-wordmark-hero"/, "demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /\{ \.\.\.vars, \.\.\.style, height \}/, "the root takes the height")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /var\(--color-/, "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, [], "fetches nothing: pictures and fonts are embedded")
assert.equal((src.match(/@font-face\{font-family:Bkm(Sans|Mono)/g) || []).length, 2, "two embedded, renamed font subsets (sans 700, mono)")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /\(hover: hover\) and \(pointer: fine\)/, "fine-pointer gate is read at runtime")
assert.match(src, /ev\.pointerType !== "mouse"/, "touch never drives the cursor, magnets or the stretch")
assert.match(src, /const pointing = \(st\.over && st\.fine\) \|\| st\.touching/, "the letters follow a fine pointer, or a finger while it's down")
assert.match(src, /links = LINKS/, "nav links are a prop with defaults")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*(\/\*[^*]*\*\/\s*\n\s*)?"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{\.bkm-cursor\{display:block\}\}/, "the context label only exists where a mouse can hover")
assert.match(css, /\.bkm-cursor\{display:none/, "and is hidden everywhere else")
assert.match(css, /\.bkm-root svg,\.bkm-root img\{max-width:none\}/, "guards Preflight's img/svg max-width")
const fonts = src.slice(src.indexOf("const FONTS ="), src.indexOf("\n\n", src.indexOf("const FONTS =")))
assert.doesNotMatch(fonts, /`|\$\{|@import/, "no backticks, ${ or @import in the font string")
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
assert.ok(rules >= 40, "the scope check saw real rules, saw " + rules)

// layout reads: one per frame (the root's box); the other on magnet enter
const loopAt = src.indexOf("const frame = (now: number) =>")
const loop = src.slice(loopAt, src.indexOf("const schedule = ()", loopAt))
assert.equal((loop.match(/getBoundingClientRect/g) || []).length, 1, "the frame reads layout exactly once")
assert.doesNotMatch(loop, /offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|innerWidth|innerHeight/, "and nothing else")
assert.equal((src.match(/getBoundingClientRect/g) || []).length, 2, "frame, magnet enter")

// ---- the story -----------------------------------------------------------
// Constants carried over unchanged from bunkum-studio-template (measured on the reference).
const S = await liftRegion(src, "story")

assert.equal(S.STRETCH, 1.89)
assert.equal(S.TAU_LETTER, 105)
assert.deepEqual([S.NEAR, S.FAR], [0.139, 0.462])
assert.deepEqual([S.LOOK, S.TAU_LOOK, S.SPIN], [175, 300, 6])
for (const [d, want] of [[35, 1], [200, 1], [314, 0.76], [426, 0.52], [593, 0.16], [700, 0]]) {
  assert.ok(Math.abs(S.pullAt(d, 1440) - want) < 0.05, "pull at " + d + ": " + S.pullAt(d, 1440).toFixed(2) + " vs " + want)
}
assert.equal(S.pullAt(-300, 1440), S.pullAt(300, 1440), "symmetric")
assert.equal(S.pullAt(10, 0), 0, "no width, no pull, never NaN")
assert.ok(Math.abs(S.approach(0, 1, 75, S.TAU_LETTER) - 0.51) < 0.04)
assert.ok(Math.abs(S.approach(0, 1, 156, S.TAU_LOOK) - 0.41) < 0.04, "carton: 41% at 156ms")
assert.equal(S.approach(5, 1, -10, 100), 5, "a negative dt never moves backwards")
const sc = 1404 / S.VB_W
assert.ok(Math.abs(S.baseFor(900, sc) * sc - 387) < 3, "rest letters 387px tall on a 900px stage")
assert.ok(S.vbH(200) >= 200 * S.STRETCH, "the viewBox has room for a full stretch")

for (const base of [120, 280, 600]) {
  for (let i = 0; i < S.WORD.length; i++) {
    for (const h of [base * 0.3, base, base * S.STRETCH]) {
      const d = S.glyph(S.WORD[i], S.cellX(i), S.CELLS[i], h, base)
      assert.ok(d.length > 10, S.WORD[i] + " draws")
      assert.doesNotMatch(d, /NaN|Infinity|-?\d+\.\d{2,}/, S.WORD[i] + " is finite and tidy: " + d)
    }
  }
}
assert.equal(S.glyph("B", 0, 96, 163, 163).split("M")[2], S.glyph("B", 0, 96, 300, 163).split("M")[2], "only the stems grow")
assert.ok(S.cellX(5) + S.CELLS[5] <= S.VB_W, "the M fits")

const centres = S.WORD.map((_, i) => 18 + S.cellMid(i) * sc)
const out = []
S.stretchTargets(null, centres, 1440, 163, out)
assert.ok(out.every((h) => h === 163), "nobody pointing: everything rests")
S.stretchTargets(centres[0], centres, 1440, 163, out)
assert.ok(Math.abs(out[0] - 163 * 1.89) < 1e-6 && out[5] === 163, "full under the pointer, rest far away")
for (let i = 1; i < 6; i++) assert.ok(out[i] <= out[i - 1] + 1e-9, "falls away monotonically")

assert.deepEqual(S.lookAt(3, -3), { rx: 175, ry: 175 }, "the carton's look is clamped")

let a = 1.2, w = 0
for (let k = 0; k < 900; k++) [a, w] = S.pendulum(a, w, 16)
assert.ok(Math.abs(a) < 0.02, "Gerald comes to rest: " + a)
assert.deepEqual([1, 4, 5, 6, 10].map(S.letsGo), [false, false, true, false, true], "the fifth poke makes him let go")

let t = 0
for (let k = 0; k < S.THEMES.length; k++) t = S.nextTheme(t)
assert.equal(t, 0, "themes cycle and come back round")
for (const th of S.THEMES) assert.match(th.bg + th.fg + th.deep, /^(#[0-9a-f]{6}){3}$/)

console.log("bunkum-wordmark-hero: ok")
