// Install-safety and behaviour check for components/italic-sweep-scroll-text.
// Run: node tests/italic-sweep-scroll-text.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "italic-sweep-scroll-text"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.match(src, /height = "100svh"/, "stage height defaults to a definite length")
assert.match(src, /scrollLength = "340svh"/, "the scroll track defaults to a definite length")
assert.ok(src.includes("style={{ height: autoPlay ? height : scrollLength }}") && src.includes("style={{ height }}"), "both lengths reach the DOM as explicit heights")
// autoplay is opt-in, loops with a blank restart, and never eases the restart backwards
assert.match(src, /autoPlay = false,/, "autoplay is off by default")
assert.match(src, /if \(pass \|\| L\.eased < 0/, "autoplay sets the progress directly (no reverse replay on restart)")
assert.match(demo, /autoPlay=\{\d+\}/, "the demo plays on its own so the preview shows the effect")
assert.doesNotMatch(src, /\bh-full\b|height:\s*100%/, "no percentage heights")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /`/, "no backticks in the file")
assert.doesNotMatch(src, /\$\{/, "no ${ in the file")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.ok(Buffer.byteLength(src) < 200 * 1024, "21st rejects component files over 200 kB")
assert.match(demo, /from "@\/components\/ui\/italic-sweep-scroll-text"/, "demo imports the installed path")
assert.ok(tsconfig.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig needs its paths line")
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "React is the only import")

// Scoped CSS: every rule starts with the component's prefix.
const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of css.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".ist-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 12, "the scope check saw real rules, saw " + rules)
const TOKENS = ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"]
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(TOKENS.includes(v) || v.startsWith("--ist-"), "token not guaranteed in a host: " + v)
for (const [, v] of demo.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(TOKENS.includes(v), "demo token not guaranteed in a host: " + v)
const hosts = new Set((src.match(/https:\/\/[a-z0-9.-]+/gi) || []).map((u) => u.toLowerCase()))
assert.deepEqual([...hosts], ["https://fonts.googleapis.com"], "the only thing fetched is the font stylesheet")
assert.ok(src.includes("{fontHref && <link"), "and the font can be turned off")
assert.doesNotMatch(demo, /https?:\/\//, "the demo is self-contained")
for (const banned of [/driving progress/i, /reason to be here/i, /pinterest/i, /pinimg/i, /framer/i]) assert.doesNotMatch(src + demo, banned, "no reference copy or identifiers: " + banned)

// --- behaviour wiring -----------------------------------------------------
assert.ok(src.includes('<span className="ist-sr">{spoken}</span>') && src.includes('<span aria-hidden="true">'), "screen readers get the plain sentence, the animated copy is hidden from them")
assert.ok(src.includes("<em key={n}>"), "the spoken sentence keeps its emphasis")
assert.ok(src.includes('matchMedia("(prefers-reduced-motion: reduce)")') && css.includes("@media (prefers-reduced-motion:reduce){.ist-root{height:auto!important}"), "reduced motion: no pinned track, settled sentence")
assert.ok(src.includes("if (reduce) paint(2)") && src.includes("if (!reduce) frame(performance.now())"), "reduced motion never starts the frame loop")
assert.ok(src.includes("L.eased += (goal - L.eased) * (1 - Math.exp(-dt / smoothing))"), "the animation runs on an eased scroll value, frame-rate independent")
assert.ok(src.includes("istTimes(plan, L.eased, [r0, r1, r2, r3], exit)"), "and on nothing else: the pose is a pure function of it")
assert.doesNotMatch(src, /addEventListener\("scroll"|addEventListener\("wheel"/, "no scroll or wheel listeners: the page scrolls natively")
assert.ok(src.includes("new IntersectionObserver") && src.includes("raf = seen ? requestAnimationFrame(frame) : 0"), "the loop stops off screen")
assert.ok(src.includes("new ResizeObserver") && src.includes('fonts.addEventListener("loadingdone", onFont)'), "lines are re-broken on resize and when the font lands")
assert.ok(css.includes(".ist-line{display:block;white-space:nowrap}"), "lines are locked so no word hops lines mid-scroll")
assert.doesNotMatch(src, /scale\(/, "nothing is enlarged with transform: scale; the marks are laid out at their real width")
assert.doesNotMatch(src, /style\.(visibility|display)\b/,"no visibility or display swaps mid-motion")
assert.ok(css.includes(".ist-stage{position:sticky;top:0;"), "the stage pins with sticky, no scroll hijack")

// --- the timeline, executed -----------------------------------------------
const T = await liftRegion(src, "timeline")
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, msg + ": " + a + " vs " + b)

// parsing
const toks = T.istParse("A page [] only *comes alive,* when\nit *is*n't.")
assert.deepEqual(toks.map((t) => t.kind), ["word", "word", "glyph", "word", "word", "word", "word", "break", "word", "word"])
assert.deepEqual(toks.filter((t) => t.kind === "word").map((t) => t.text), ["A", "page", "only", "comes", "alive,", "when", "it", "isn't."])
const alive = toks.find((t) => t.text === "alive,")
assert.equal(alive.text.slice(alive.a, alive.b), "alive,", "emphasis covers what sits inside the asterisks")
const isnt = toks.find((t) => t.text === "isn't.")
assert.equal(isnt.text.slice(isnt.a, isnt.b), "is", "emphasis can stop inside a word")
assert.equal(toks[0].a, toks[0].b, "a plain word has no emphasis")
assert.deepEqual(T.istParse("  "), [], "blank text is no tokens")

// the plan, against the timings measured on the reference (one unit = 2 frames at 30 fps)
// same shape as the reference sentence: 13 words, a mark after word 2 and word 11, emphasis on words 4 and 5
const ref = T.istParse("aa bb [] cccccc *ddddddd eeeeeeee,* ff ggggg hhhh i jjjjjj kk [] ll mmmmm")
const plan = T.istPlan(ref, 3.5)
assert.equal(plan.words.length, 13)
assert.deepEqual(plan.words.map((w) => w.s), [...Array(13).keys()], "one word per step")
near(plan.letters[3][0], 5, 1e-9, "the first letter turns two steps after its word starts")
near(plan.letters[3][6], 5 + 6 * 0.93, 1e-9, "letters follow 0.93 steps apart")
assert.ok(plan.letters[4][0] > plan.letters[3][6], "the sweep carries on into the next word")
assert.equal(plan.letters[4].length, 9, "the comma inside the asterisks turns too")
assert.deepEqual(plan.glyphs.map((g) => g.s), [6.75, 15.75], "the words beside a mark give way 5.75 steps after the word before it starts")
assert.ok(plan.enterLen >= Math.max(...plan.glyphs.map((g) => g.s)) + 2.25, "the entrance leaves room for the mark to grow into its space")
near(plan.exitWords[0].s, 5.5, 1e-9, "words start leaving once both marks have closed")
near(plan.exitLen, 5.5 + 12 * 0.8 + 1.6, 1e-9)

// clocks
const R = [0.03, 0.44, 0.6, 0.95]
assert.deepEqual(T.istTimes(plan, 0, R, true), [0, 0])
assert.deepEqual(T.istTimes(plan, 0.5, R, true), [plan.enterLen, 0], "between the two ranges the sentence holds")
assert.deepEqual(T.istTimes(plan, 1, R, true), [plan.enterLen, plan.exitLen])
assert.deepEqual(T.istTimes(plan, 1, R, false), [plan.enterLen, 0], "exit off: the sentence stays")

// a word: hidden, then waiting low, then a steep snap up, then a lift and out
assert.deepEqual(T.istWord(plan, 0, 0, 0, 0.59, 0.27), [0.59, 0], "before its turn a word is low and invisible")
const early = T.istWord(plan, 0, 3.5 * 0.33, 0, 0.59, 0.27)
assert.ok(early[1] === 1 && early[0] > 0.59 * 0.9, "a third of the way in it is fully inked and has barely moved (measured: 4%)")
const late = T.istWord(plan, 0, 3.5 * 0.67, 0, 0.59, 0.27)
assert.ok(late[0] < 0.59 * 0.1, "two thirds in it has all but landed (measured: 85 to 96%)")
assert.deepEqual(T.istWord(plan, 0, plan.enterLen, 0, 0.59, 0.27), [0, 1], "settled: on its line, fully inked")
const out = T.istWord(plan, 0, plan.enterLen, plan.exitWords[0].s + 1.6, 0.59, 0.27)
near(out[0], -0.27, 1e-9, "leaving: lifted")
near(out[1], 0, 1e-9, "and gone")
for (let i = 0; i < 13; i++) {
  let prevY = Infinity
  for (let te = 0; te <= plan.enterLen; te += 0.05) {
    const y = T.istWord(plan, i, te, 0, 0.59, 0.27)[0]
    assert.ok(y <= prevY + 1e-12, "a word only ever rises on the way in")
    prevY = y
  }
}
// enter after exit: nothing is half in while something is half out
assert.ok(R[1] < R[2], "the entrance ends before the exit starts")

// marks: the space opens from the outside in, the mark grows into it last; on the way out the mark goes first
assert.equal(T.istOpen(plan, 0, 7, 0), 0, "the first mark appears 6 steps after the word before it (frame 15 of the reference)")
assert.ok(T.istOpen(plan, 0, 7.2, 0) > 0)
assert.ok(T.istOpen(plan, 0, 8, 0) < 0.6, "it is still a sliver a step later (frame 17)")
assert.equal(T.istOpen(plan, 0, 9, 0), 1, "and fully open by frame 19")
assert.equal(T.istOpen(plan, 1, 16, 0), 0)
assert.equal(T.istOpen(plan, 0, plan.enterLen, 1), 0, "the mark is gone one step into the exit")
assert.equal(T.istOpen(plan, 1, plan.enterLen, 2.5), 1, "the second mark closes after the first")
for (let te = 0; te <= plan.enterLen; te += 0.05) {
  for (let d = 0; d < 6; d++) assert.ok(T.istGap(plan, 0, te, 0, d + 1) >= T.istGap(plan, 0, te, 0, d) - 1e-12, "opening: a farther word has always given way at least as much")
  assert.ok(T.istGap(plan, 0, te, 0, 0) >= T.istOpen(plan, 0, te, 0) - 1e-12, "opening: the mark never outgrows its space")
}
for (let tx = 0; tx <= plan.exitLen; tx += 0.05) {
  for (let d = 0; d < 6; d++) assert.ok(T.istGap(plan, 0, plan.enterLen, tx, d + 1) >= T.istGap(plan, 0, plan.enterLen, tx, d) - 1e-12, "closing: a nearer word always comes back first")
  assert.ok(T.istGap(plan, 0, plan.enterLen, tx, 0) >= T.istOpen(plan, 0, plan.enterLen, tx) - 1e-12, "closing: the mark is out of the way before the words close in")
}
for (let d = 0; d < 6; d++) {
  assert.equal(T.istGap(plan, 0, 0, 0, d), 0)
  assert.equal(T.istGap(plan, 1, plan.enterLen, 0, d), 1, "everyone has settled by the end of the entrance")
  assert.ok(T.istGap(plan, 1, plan.enterLen, plan.exitWords[0].s, d) <= 0.5, "and the spaces are at least half closed before the first word lifts")
  assert.equal(T.istGap(plan, 1, plan.enterLen, plan.exitLen, d), 0)
}

// italic sweep
assert.equal(T.istItalic(plan, 3, 4.99), 0)
assert.equal(T.istItalic(plan, 3, 5), 1)
assert.equal(T.istItalic(plan, 3, plan.enterLen), 7)
assert.equal(T.istItalic(plan, 0, plan.enterLen), 0, "plain words never turn")

// mark poses: four shapes, each piece never taller than wide enough to be a circle at most
const max = T.istGlyphMax()
for (let s = 0; s < 4; s += 0.01) for (const g of [0, 1]) {
  const [w1, r1, w2, r2] = T.istGlyphPose(s, g)
  assert.ok(w1 > 0 && w2 > 0 && r1 <= w1 / 2 + 1e-9 && r2 <= w2 / 2 + 1e-9, "a piece is at most a circle")
  assert.ok(w1 + w2 + 0.07 <= max + 1e-9, "a mark never outgrows the width the lines were broken for")
}
assert.deepEqual(T.istGlyphPose(0, 0), [0.68, 0.34, 0.26, 0.05], "resting pose")
assert.notDeepEqual(T.istGlyphPose(0, 0), T.istGlyphPose(0, 1), "the two marks are out of step")

console.log("italic-sweep-scroll-text: ok")
