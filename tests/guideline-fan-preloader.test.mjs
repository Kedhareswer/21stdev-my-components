// Install-safety and choreography check for components/guideline-fan-preloader.
// Run: node tests/guideline-fan-preloader.test.mjs
//
// The first half is source assertions: the rules that only fail once the file
// is installed somewhere else. The second half lifts the "// #region timeline"
// and "// #region turn" blocks out of the component and runs them against
// values measured on the reference video (720 x 540, 30 fps, 18.5 s).
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "guideline-fan-preloader"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const readme = readFileSync(new URL("README.md", dir), "utf8")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(
  tsconfig.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'),
  "tsconfig paths line",
)
assert.match(demo, /from "@\/components\/ui\/guideline-fan-preloader"/, "demo imports the installed path")

assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /height: height/, "root carries the height prop")
assert.doesNotMatch(src + demo, /\bh-full\b/, "no h-full: percentage heights collapse once installed")
assert.doesNotMatch(src, /@import/, "no @import: the host owns its stylesheet")
assert.doesNotMatch(src, /`/, "no backticks in the file")
assert.doesNotMatch(src, /\$\{/, "no ${ in the file")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads: geometry is container units")
assert.ok(Buffer.byteLength(src) < 80_000, "component stays lean, " + Buffer.byteLength(src))
assert.ok(Buffer.byteLength(demo) < 200_000, "demo under 21st's 200 kB limit")

// Scoped CSS: every rule starts at the component's own prefix.
const cssAt = src.indexOf("const CSS =")
assert.ok(cssAt > -1, "has a CSS string")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
const flat = css
  .replace(/"\s*\+\s*\n\s*"/g, "")
  .replace(/"\s*\+\s*(?:[A-Z_0-9]+|[uq]\([^)]*\))\s*\+\s*"/g, "0")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => /^(\.dark )?\.gfp-/.test(s.trim())),
    "unscoped selector: " + sel,
  )
}
assert.ok(rules >= 50, "the scope check saw real rules, saw " + rules)
assert.doesNotMatch(flat, /(^|[{}"])\s*(\*|body|html|:root)\s*\{/, "no bare global resets")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(flat, /\.gfp-ph img,\.gfp-card img\{[^}]*max-width:none/, "images override Preflight's max-width")
assert.match(flat, /\.gfp-face img\{[^}]*max-width:none/, "solid faces override Preflight's max-width too")
assert.doesNotMatch(src, /webgl|<canvas|getContext/i, "the solids are CSS 3D: no canvas, no WebGL")
assert.match(flat, /\.gfp-form,\.gfp-shape\{[^}]*transform-style:preserve-3d/, "the solids keep their depth")
assert.ok(src.includes('maxWidth: "none"'), "inline guard against img max-width:100%")
assert.ok(src.includes("width={480}") && src.includes("height={480}"), "images carry explicit width/height")
assert.match(flat, /container-type:size/, "the root is the container the cq units resolve against")

// Tokens: the overlay brings its own palette; nothing else is assumed.
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) {
  assert.ok(/^--(gfp-|[vhxyzqwe]\d?$|lx$|lw$|dot$|bk$|bo$|o[a-z]{1,2}$)/.test(v), "token not defined by the component: " + v)
}
for (const [, v] of demo.matchAll(/var\((--[a-z0-9-]+)/g)) {
  assert.ok(
    ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"].includes(v),
    "demo token not guaranteed in a host: " + v,
  )
}

// Pictures come from the catalog site, fonts from Google Fonts, nothing else.
assert.ok(src.includes('"https://kedhar-components.pages.dev/' + slug + '/"'), "image base is the catalog")
for (const h of new Set((src.match(/https:\/\/[a-z0-9.-]+/gi) || []).map((x) => x.toLowerCase()))) {
  assert.ok(["https://kedhar-components.pages.dev", "https://fonts.googleapis.com"].includes(h), "unexpected host " + h)
}
assert.deepEqual([...demo.matchAll(/https?:\/\/[^"'\s)]+/g)], [], "the demo is self-contained")
for (const n of ["sheep", "temple", "arches", "tower", "bicycle", "croissants", "cloth"]) {
  assert.ok(src.includes('"' + n + '"'), "uses picture " + n)
  readFileSync(new URL("../dev/public/" + slug + "/" + n + ".webp", import.meta.url))
}

// Contract the brief asked for.
for (const p of ["text", "duration", "onComplete", "children", "images", "height", "scenes", "loop", "title", "headline"]) {
  assert.match(src, new RegExp("\\n  " + p + "\\?:"), "prop " + p)
  assert.ok(readme.includes("`" + p + "`"), "README documents " + p)
}
assert.match(src, /\n  loop = true,/, "the reel loops unless told otherwise")
assert.doesNotMatch(demo, /<main|<section|children/, "the demo is the preloader alone: no page under it")
assert.match(demo, /<GuidelineFanPreloader [^>]*\/>/, "and it loops by default")
assert.match(src, /if \(!loop\) \{\n\s+apply\(total\)\n\s+finish\(\)/, "played once, it still finishes and calls onComplete")
assert.match(src, /toggleAttribute\("inert", !done\)/, "the page is inert while it is covered")

// No identifiers from the reference.
for (const banned of [/smart stud/i, /\bBLR\b/, /pinterest/i, /pinimg/i, /oakwood/i, /croissant study/i, /built to roll/i, /built to order/i, /framer/i]) {
  assert.doesNotMatch(src + demo + readme, banned, "no identifiers from the reference: " + banned)
}

// --- choreography ---------------------------------------------------------
const { gfpPose, gfpLength, GFP_TOTAL, GFP_REST, GFP_ENDS, GFP_EXIT } = await liftRegion(src, "timeline")
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, msg + ": " + a + " vs " + b)
const C = 3
const px = (p) => [p.v0 * 7.2, p.v1 * 7.2, p.h0 * 5.4, p.h1 * 5.4].map(Math.round)
// Guides in reference pixels, to within a pixel of the tracked value.
const grid = (t, want, msg) => px(gfpPose(t)).forEach((v, i) => near(v, want[i], 1, msg + " [" + i + "]"))

assert.equal(GFP_TOTAL, 18.55, "four scenes run as long as the reference plus its pan")
assert.deepEqual([1, 2, 3, 4].map(gfpLength), GFP_ENDS.map((e) => e + GFP_EXIT), "each scene count has its own length")
near(gfpLength(1), 3.317, 0.001, "scene 1 alone is 3.3 s")

// Scene boundaries follow the reference's cuts.
assert.deepEqual([0, 3.26, 3.27, 7.99, 8, 12.62, 12.64, 18.5].map((t) => gfpPose(t).scene), [1, 1, 2, 2, 3, 3, 4, 4], "cuts at 3.267, 8.0 and 12.633")
assert.equal(gfpPose(10, 1).scene, 1, "scenes={1} never leaves scene 1")
assert.equal(gfpPose(10, 2).scene, 2, "scenes={2} stops at the chair")

// 1. One guide slides in from a third of the way across and settles.
near(gfpPose(0).v1, 32.8, 0.1, "guide starts at 32.8% of the width")
near(gfpPose(1 / 30).v1, 45, 3.2, "one frame later (reference: 45%)")
near(gfpPose(0.4).v1, 61.3, 0.4, "settles at 61.3%")
near(gfpPose(0.4).h0, 33.5, 0.01, "top guide holds at 33.5% of the height")
assert.ok(gfpPose(0.4).v0 < 0, "the left guide is still off screen")

// 2. The frame opens: cubic ease-out over 0.3 s from 0.533 s.
near(gfpPose(0.6).v1, 69.7, 1.2, "two frames into the opening (reference: 69.7%)")
const open = gfpPose(0.9)
near(open.v0, 11.5, 0.01, "left guide")
near(open.v1, 76.5, 0.01, "right guide")
near(open.h0, 13, 0.01, "top guide")
near(open.h1, 85.7, 0.01, "bottom guide")

// 3. The pin fades in just before 1 s; nothing else is on stage yet.
assert.equal(gfpPose(0.85).pin, 0, "no pin before 0.9 s")
assert.equal(gfpPose(1.05).pin, 1, "pin is in by 1.05 s")
assert.ok(gfpPose(1.25).cards.every((c) => c.o === 0), "no cards before 1.3 s")

// 4. The lead card pops in at half size, overshoots to 111%, settles.
near(gfpPose(1.334).cards[C].k * 234, 105, 6, "first visible frame is about half size")
near(gfpPose(1.58).cards[C].k * 234, 234, 1, "overshoot")
near(gfpPose(1.8).cards[C].k * 234, 210, 0.5, "settled at 210")
assert.ok(gfpPose(1.6).cards.every((c, i) => i === C || c.o === 0), "side cards wait behind it")

// 5. The fan.
const fan = gfpPose(GFP_REST)
assert.deepEqual(fan.cards.map((c) => Math.round(c.x)), [-235, -157, -83, 0, 87, 171, 250], "fan offsets")
assert.deepEqual(fan.cards.map((c) => Math.round(c.k * 234)), [120, 150, 180, 210, 180, 150, 120], "fan sizes")
assert.ok(fan.cards.every((c) => c.o === 1 && Math.abs(c.y) <= 2), "all seven on one line")
assert.deepEqual(fan.cards.map((c) => c.z), [40, 50, 60, 70, 60, 50, 40], "lead card on top, rings behind")
assert.ok(gfpPose(1.75).cards[2].x < 0 && gfpPose(1.75).cards[0].x === 0, "inner ring leaves first")

// 6. The staircase, and the two stacking flips the reference makes.
const stair = gfpPose(2.7)
assert.deepEqual(stair.cards.map((c) => Math.round(c.y)), [36, -43, -111, -53, 25, 70, 111], "staircase rises and drops")
assert.ok(stair.cards[0].z > stair.cards[1].z, "the far-left card comes over its neighbour")
assert.ok(stair.cards[6].z > stair.cards[5].z, "the far-right card comes over its neighbour")
assert.ok(gfpPose(2.5).cards[C].y < -40 && gfpPose(2.5).cards[0].y === 0, "the lead card moves first, the far left last")

// 7. The sweep: over the top, then out to the right, shrinking.
const top = gfpPose(3.067)
near(top.cards[0].x, -13, 0.5, "far-left card is over the middle")
near(top.cards[0].y, -170, 0.5, "and at the top of its arc")
let lastX = -Infinity
for (let t = 2.84; t <= 3.23; t += 0.01) {
  const x = gfpPose(t).cards[C].x
  assert.ok(x >= lastX - 1e-9, "the lead card never moves back left at " + t.toFixed(2))
  lastX = x
}
const gone = gfpPose(3.233)
assert.ok(gone.cards.every((c) => c.x - (c.k * 234) / 2 > 360), "every card has cleared the 720-wide canvas")
assert.ok(gone.push >= 1, "and the wide-screen share has reached the full extra half-width")
assert.equal(gfpPose(2.2).push, 0, "no wide-screen push while the fan is centred")

// 8. Scene 1 hands over on a whip pan to the left; scene 2 arrives on its tail.
assert.equal(gfpPose(3.167).ox, 0, "no pan before 3.167 s")
near(gfpPose(3.2).ox, -29, 9, "first pan frame (reference: 29 px)")
near(gfpPose(3.233).ox, -127, 22, "second pan frame (reference: 127 px)")
near(gfpPose(3.267).ox, 73, 0.5, "scene 2 starts 73 px to the right")
near(gfpPose(3.3).ox, 27, 4, "one frame later (reference: 27 px)")
near(gfpPose(3.5).ox, 0, 0.3, "and has settled within a quarter of a second")
assert.equal(gfpPose(3.2, 1).ox, 0, "played alone, scene 1 has no hand-off pan")

// 9. Scene 2: guides, flurry, the red cell, the chair.
grid(4, [237, 482, 179, 361], "scene 2 guides at rest")
grid(5.5, [219, 500, 165, 375], "the cell has opened by 5.5 s")
assert.ok(gfpPose(3.4).cards.every((c) => c.o === 0), "nothing flies before 3.43 s")
const fly = gfpPose(3.6)
assert.equal(fly.cards.filter((c) => c.o === 1).length, 1, "one photo in the air at 3.6 s")
assert.ok(fly.cards[6].x < -100 && fly.cards[6].y > 150, "it comes up from the bottom-left")
assert.ok(gfpPose(4.0).cards.filter((c) => c.o === 1).length >= 3, "several overlap in mid-flurry")
assert.ok(gfpPose(4.56).cards.every((c) => c.o === 0), "the last one has shrunk to a dot by 4.55 s")
near(gfpPose(4.6).block.k, 0.16, 0.03, "red cell: 16% one frame after the dot (reference: 39 of 245 px)")
near(gfpPose(4.633).block.k, 0.32, 0.03, "32% a frame later (reference: 78 px)")
assert.equal(gfpPose(4.75).block.k, 1, "the cell is full by 4.75 s")
assert.equal(gfpPose(4.7).obj.o, 0, "the cube waits for the cell")
assert.deepEqual([gfpPose(4.9).obj.kind, gfpPose(4.9).obj.o], [1, 1], "the cube is in by 4.9 s")
assert.ok(gfpPose(7).obj.yaw > gfpPose(5).obj.yaw, "and keeps turning")
near(gfpPose(7.967).oy, 32, 8, "scene 2 leaves on a pan downwards (reference: 27 px)")

// 10. Scene 3: drops in, the white cell opens, the pastry pops, the zoom.
near(gfpPose(8).oy, -177, 0.5, "scene 3 starts 177 px high")
near(gfpPose(8.1).oy, -45, 8, "three frames later (reference: -45 px)")
grid(8.5, [244, 475, 193, 366], "scene 3 guides at rest")
grid(9.167, [204, 505, 149, 398], "the cell has opened as the pastry lands")
assert.equal(gfpPose(9.1).obj.o, 0, "no pastry before 9.13 s")
assert.ok(gfpPose(9.14).obj.s < gfpPose(9.2).obj.s * 0.75, "its first frame is small (reference frame 275)")
assert.ok(gfpPose(9.2).obj.s / gfpPose(9.2).zoom > gfpPose(9.8).obj.s / gfpPose(9.8).zoom * 1.2, "it pops in oversized and settles")
grid(11.5, [225, 483, 172, 368], "the grid pulls back at 11.5 s")
grid(12.4, [166, 593, 119, 415], "then zooms in to the end of the scene")
assert.ok(gfpPose(12.4).zoom > 1.8, "labels and pastry scale with that zoom")

// 11. Scene 4: three words, the cut to the bicycle layout, the spin.
grid(12.633, [44, 676, 34, 507], "scene 4 opens zoomed right in")
assert.deepEqual(gfpPose(12.633).words, [0, 0, 0], "no words on the first frame")
const w = gfpPose(12.7).words
assert.ok(w[0] === 1 && w[1] > 0 && w[1] < 1 && w[2] === 0, "at 12.7 s the first word is in and the second is fading up")
assert.deepEqual(gfpPose(12.85).words, [1, 1, 1], "all three by 12.85 s")
assert.equal(gfpPose(13.38).late, false, "big words until 13.4 s")
assert.equal(gfpPose(13.4).late, true, "then the cut to the bicycle layout (reference frame 403)")
// The reference strobes a bright block on frames 404, 406, 408 and 410. Three flashes are kept.
const strobe = [403, 404, 405, 406, 407, 408, 409, 410, 411].map((f) => gfpPose((f - 1) / 30 + 0.01).block.o)
assert.deepEqual(strobe, [0, 1, 0, 1, 0, 1, 0, 0, 0], "block on for one frame, off for the next, three times")
assert.ok(gfpPose(13.75).obj.cx > 120, "the bicycle starts off the right edge")
near(gfpPose(14.4).obj.cx * 7.2, 436, 2, "and settles at x 436")
grid(14.7, [237, 623, 147, 361], "the cell stretches out to hold it")
assert.equal(gfpPose(15.3).obj.yaw, 0, "side view until 15.4 s")
near(gfpPose(16.2).obj.yaw, -127, 1.5, "swings to 128 degrees and holds (frame silhouette 127 px of 207 wide)")
near(gfpPose(15.6).obj.yaw, -88, 2, "passing end-on at 15.6 s (silhouette 37 px)")
near(gfpPose(17).obj.yaw, -92, 1, "end-on at 17.0 s (silhouette 45 px)")
near(gfpPose(17.3).obj.yaw, 66, 1, "front wheel nearest by 17.3 s (silhouette 123 px at 1.45x)")
near(gfpPose(17.44).obj.yaw, 90, 1, "end-on again at 17.44 s")
let turn = -200
for (let t = 16.3; t <= 18.2; t += 0.02) {
  assert.ok(gfpPose(t).obj.yaw >= turn - 1e-9, "from the hold on, the bicycle only turns one way")
  turn = gfpPose(t).obj.yaw
}
near(gfpPose(17.1).obj.s / 170, 1.66, 0.01, "zoomed to 1.66 at the top of the spin")
assert.equal(gfpPose(18.2).obj.yaw, 180, "ends on its other side")
grid(18.3, [162, 586, 139, 384], "final guides")

// 12. Exit: a whip pan that starts only when the last scene has finished.
assert.equal(gfpPose(18.4).pan, 0, "no exit pan before 18.4 s")
near(gfpPose(GFP_TOTAL).pan, 1, 1e-9, "the overlay is fully off at the end")
assert.equal(gfpPose(18.5).dir, 1, "after the last scene it pans right, as the reference does")
assert.equal(gfpPose(3.2, 1).dir, -1, "after scene 1 alone it pans left")
near(gfpPose(3.2, 1).pan, 0.036, 0.012, "scene 1 alone: first pan frame (reference: 26 px of 720)")
near(gfpPose(3.233, 1).pan, 0.176, 0.03, "second pan frame (reference: 127 px of 720)")
near(gfpPose(gfpLength(1), 1).pan, 1, 1e-9, "and is off by 3.32 s")

// 13. Continuity: within a scene nothing jumps between 60 fps frames, and the
// counter only climbs.
let prev = gfpPose(1.69)
for (let t = 1.69 + 1 / 60; t <= 3.25; t += 1 / 60) {
  const p = gfpPose(t)
  p.cards.forEach((c, i) => {
    const d = Math.hypot(c.x - prev.cards[i].x, c.y - prev.cards[i].y)
    assert.ok(d < 75, "card " + i + " jumps " + d.toFixed(1) + " at " + t.toFixed(3))
  })
  prev = p
}
for (const [a, b] of [[3.3, 7.9], [8.3, 12.6], [12.64, 18.4]]) {
  let last = gfpPose(a)
  for (let t = a + 1 / 60; t <= b; t += 1 / 60) {
    const p = gfpPose(t)
    for (const k of ["v0", "v1", "h0", "h1"]) assert.ok(Math.abs(p[k] - last[k]) < 3.5, k + " jumps at " + t.toFixed(3))
    // the pastry pops from half size to 132% in two frames, as measured: that jump is the point
    if (p.obj.o && last.obj.o && !(t > 9.12 && t < 9.23)) {
      // the fastest measured turn is the whip through side-on: 124 degrees in a tenth of a second
      assert.ok(Math.abs(p.obj.yaw - last.obj.yaw) < 25, "object yaw jumps at " + t.toFixed(3))
      assert.ok(Math.abs(p.obj.s - last.obj.s) / last.obj.s < 0.12, "object scale jumps at " + t.toFixed(3))
    }
    last = p
  }
}
let pct = 0
for (let t = 0; t <= GFP_TOTAL; t += 1 / 60) {
  const p = gfpPose(t).percent
  assert.ok(p >= pct && p <= 100, "counter only climbs")
  pct = p
}
assert.equal(gfpPose(18.4).percent, 100, "counter reads 100 as the exit starts")
assert.equal(gfpPose(3.167, 1).percent, 100, "and tracks the scene count")

// --- the shared turn ------------------------------------------------------
const { gfpTurn } = await liftRegion(src, "turn")
assert.deepEqual(gfpTurn(0, 0, 0, 0), [1, 0, 0, 0, 1, 0, 0, 0, 1], "no turn is the identity")
const half = gfpTurn(0, 0, 180, 0)
near(half[0], -1, 1e-9, "yaw 180 mirrors x")
near(half[8], -1, 1e-9, "and z: the print shows its other side")
const quarter = gfpTurn(0, 0, 90, 0)
near(quarter[2], 1, 1e-9, "yaw 90 brings the front face round to the right")
for (const m of [gfpTurn(20, -12, 47, 0), gfpTurn(11, 11, -128, 0)]) {
  // a rotation: rows are unit length and at right angles
  for (let i = 0; i < 3; i++) near(Math.hypot(m[i * 3], m[i * 3 + 1], m[i * 3 + 2]), 1, 1e-9, "row " + i + " is unit length")
  near(m[0] * m[3] + m[1] * m[4] + m[2] * m[5], 0, 1e-9, "rows 0 and 1 are orthogonal")
}

// The three solids: every face has an image-or-blank and a unit outward normal;
// no picture appears twice in a scene (cells included).
// Class names are flat in one prefix: a face or solid class that is also a label class
// inherits that label's left/top rule and flies off (it happened: gfp-c1..c4, gfp-k1..k3).
const rulesFor = (cls) => [...flat.matchAll(new RegExp("\\." + cls + "(?![\\w-])[^{]*\\{([^}]*)\\}", "g"))].map((m) => m[1])
for (const cls of ["gfp-x0", "gfp-x1", "gfp-x2", "gfp-x3", "gfp-x4", "gfp-x5", "gfp-r0", "gfp-r1", "gfp-r2", "gfp-r3", "gfp-r4", "gfp-p0", "gfp-p1", "gfp-as1", "gfp-as2", "gfp-as3"]) {
  const rules = rulesFor(cls)
  assert.ok(rules.length >= 1, "rule for " + cls)
  for (const r of rules) assert.doesNotMatch(r, /(^|;)(left|right|top|bottom):/, cls + " must not pick up a positioning rule")
}
const faces = [...src.matchAll(/\{face\("gfp-([a-z])(\d)", "([-0-9.,]+)", (-?\d)\)\}/g)].map((m) => ({ shape: m[1], normal: m[3].split(",").map(Number), pic: +m[4] }))
assert.equal(faces.length, 13, "six cube faces, five ring frames, two print faces")
for (const f of faces) near(Math.hypot(...f.normal), 1, 0.002, "unit normal " + f.normal)
const used = (shape) => faces.filter((f) => f.shape === shape && f.pic >= 0).map((f) => f.pic)
// corner cells: scene 2 tower (3) and temple (1); scene 3 pastry (5) and bicycle (4); scene 4 bicycle (4) and sheep (0)
for (const [shape, cells] of [["x", [3, 1]], ["r", [5, 4]], ["p", [4, 0]]]) {
  assert.ok(used(shape).length >= 2, "solid " + shape + " has pictures")
  const list = used(shape)
  assert.equal(new Set(list).size, list.length, "no picture twice on solid " + shape)
  for (const c of cells) assert.ok(!list.includes(c), "solid " + shape + " does not repeat corner-cell picture " + c)
}

console.log("guideline-fan-preloader: ok")
