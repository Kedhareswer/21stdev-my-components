// Install-safety and choreography check for components/perimeter-wordmark-preloader.
// Run: node tests/perimeter-wordmark-preloader.test.mjs
//
// The first half is source assertions: the rules that only fail once the file
// is installed somewhere else. The second half lifts the "// #region timeline"
// block out of the component and runs it against values tracked on the
// reference video (642 x 400 panel, 60 fps).
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "perimeter-wordmark-preloader"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8").replace(/\r\n/g, "\n")
const readme = readFileSync(new URL("README.md", dir), "utf8")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
const demoImports = [...demo.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(demoImports, ["react", "@/components/ui/" + slug], "the demo imports react and the installed path")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(
  tsconfig.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'),
  "tsconfig paths line",
)

assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /style=\{\{ height: height \}\}/, "root carries the height prop")
assert.doesNotMatch(src + demo, /\bh-full\b/, "no h-full: percentage heights collapse once installed")
assert.doesNotMatch(src + demo, /@import/, "no @import: the host owns its stylesheet")
assert.doesNotMatch(src + demo, /`/, "no backticks in either file")
assert.doesNotMatch(src + demo, /\$\{/, "no ${ in either file")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(
  src,
  /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/,
  "no layout reads: geometry is container units",
)
assert.doesNotMatch(src + demo, /console\./, "no debug logging ships")
assert.ok(Buffer.byteLength(src) < 60_000, "component stays lean")
assert.ok(Buffer.byteLength(demo) < 200_000, "demo under 21st's 200 kB limit")

// Scoped CSS: every rule starts at the file's own prefix.
function scoped(text, prefix, min) {
  const at = text.indexOf("const CSS =")
  assert.ok(at > -1, "has a CSS string")
  const flat = text.slice(at, text.indexOf("\n\n", at)).replace(/"\s*\+\s*\n\s*"/g, "")
  let rules = 0
  for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
    const sel = m[1].trim()
    if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
    rules++
    assert.ok(sel.split(",").every((s) => s.trim().startsWith(prefix)), "unscoped selector: " + sel)
  }
  assert.ok(rules >= min, "the scope check saw real rules, saw " + rules)
  assert.doesNotMatch(flat, /(^|[{}"])\s*(\*|body|html|:root)\s*\{/, "no bare global resets")
  assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
  return flat
}
const css = scoped(src, ".pwp-", 12)
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(css, /\.pwp-root\{[^}]*container-type:size/, "the root is the container the cq units resolve against")
assert.match(css, /\.pwp-root\{[^}]*overflow:hidden/, "the dropping panel cannot stretch the host page")
assert.match(css, /\.pwp-run\{[^}]*container-type:inline-size/, "each letter's run is the container its travel resolves against")
assert.doesNotMatch(css, /scale\(/, "letters are laid out at size, never scaled up")
assert.doesNotMatch(css, /transform:none/, "no state erases a base transform")
assert.doesNotMatch(src, /\.style\.(visibility|display)/, "nothing swaps visibility or display mid-motion")

// Tokens: the stage brings its own palette and publishes only its own variables.
for (const [, v] of (src + demo).matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(v.startsWith("--pwp-"), "token not guaranteed in a host: " + v)
for (const v of ["--pwp-g", "--pwp-iy", "--pwp-fs"]) {
  assert.ok(css.includes(v + ":"), "the stage defines " + v)
  assert.ok(readme.includes("`" + v + "`"), "README documents " + v)
}

// The component and its demo fetch nothing.
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing")
assert.deepEqual([...demo.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the demo fetches nothing")

// Contract the brief asked for.
for (const p of ["text", "duration", "onComplete", "onReveal", "children", "height", "panel", "color", "fontFamily", "keepWordmark"]) {
  assert.match(src, new RegExp("\\n  " + p + "\\?:"), "prop " + p)
  assert.ok(readme.includes("`" + p + "`"), "README documents " + p)
}
assert.match(src, /onCompleteRef\.current\(\)/, "onComplete is called through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/, "effects do not depend on onComplete's identity")
assert.match(src, /toggleAttribute\("inert", phase !== "done"\)/, "the page is inert while it is covered")
assert.match(src, /aria-busy=\{phase !== "done"\}/, "the stage reports that it is busy")
assert.match(src, /role="img"[\s\S]{0,40}aria-label=\{word\}/, "the scattered letters read as one word")
assert.match(src, /cancelAnimationFrame\(raf\)/, "the clock stops on unmount")
// The demo is the preloader alone, looping (no page under it).
assert.match(demo, /key=\{run\}/, "each loop remounts the preloader")
assert.match(demo, /onReveal=\{again\}/, "the next loop is timed from the panel dropping")
assert.match(demo, /clearTimeout\(timer\.current\)/, "the loop timer is cleared on unmount")
assert.doesNotMatch(demo, /children|pwpd-/, "no page under the preloader in the demo")

// No identifiers from the reference.
for (const banned of [/\bario\b/i, /10 years/i, /pinterest/i, /pinimg/i, /details\.so/i, /lawyer/i, /voronko/i, /oleksii/i, /press center/i, /bframerb/i]) {
  assert.doesNotMatch(src + demo + readme, banned, "no identifiers from the reference: " + banned)
}

// --- choreography ---------------------------------------------------------
const { pwpPose, pwpPoint, pwpEase, pwpUnits, pwpAdvance, PWP_HOLD, PWP_MOVE, PWP_WIPE_AT, PWP_WIPE } = await liftRegion(src, "timeline")
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, msg + ": " + a + " vs " + b)

// 1. The easing is cubic-bezier(0.65, 0, 0.35, 1).
assert.equal(pwpEase(-1), 0)
assert.equal(pwpEase(0), 0)
assert.equal(pwpEase(1), 1)
assert.equal(pwpEase(2), 1)
near(pwpEase(0.5), 0.5, 1e-6, "symmetric")
near(pwpEase(0.25), 0.0708, 0.002, "slow start")
near(pwpEase(0.75), 0.9292, 0.002, "slow stop")
for (let u = 0.02; u <= 1; u += 0.02) assert.ok(pwpEase(u) > pwpEase(u - 0.02), "monotonic at " + u)

// 2. Lengths, in periods (one period is one second of the reference).
assert.deepEqual([PWP_HOLD, PWP_MOVE, PWP_WIPE_AT, PWP_WIPE], [0.4, 0.78, 0.22, 0.76], "measured lengths")
near(pwpUnits(4), 3.38, 1e-9, "four letters: hold, two full periods, the wipe")
near(pwpUnits(2), 1.38, 1e-9, "two letters: one move")
near(pwpUnits(1), 1.38, 1e-9, "one letter still gets a hold and a wipe")

// 3. Start and end.
assert.deepEqual(pwpPose(0, 4).stations, [0, 1, 2, 3], "each letter starts one corner further round")
assert.equal(pwpPose(0, 4).wipe, 0, "panel covers the page")
assert.deepEqual(pwpPose(1, 4).stations, [0, 0, 0, 0], "every letter ends at home")
assert.equal(pwpPose(1, 4).wipe, 1, "panel is gone")
assert.deepEqual(pwpPose(0.1, 4).stations, [0, 1, 2, 3], "nothing moves during the hold")

// 4. The reference, frame by frame. Its clip starts 0.03 s after the first move does.
//    [seconds into the clip, station of the 2nd, 3rd and 4th letter, share of the panel that has dropped]
const at = (sec) => pwpPose((PWP_HOLD + sec + 0.03) / pwpUnits(4), 4)
const REF = [
  [0.0, 0.998, 1.988, 2.99, 0],
  [0.14, 0.951, 1.944, 2.947, 0],
  [0.28, 0.77, 1.764, 2.765, 0],
  [0.35, 0.548, 1.54, 2.542, 0],
  [0.42, 0.316, 1.316, 2.315, 0],
  [0.56, 0.053, 1.056, 2.053, 0],
  [0.84, 0, 1, 2, 0],
  [1.12, 0, 0.967, 1.964, 0],
  [1.33, 0, 0.57, 1.565, 0],
  [1.47, 0, 0.177, 1.177, 0],
  [1.82, 0, 0, 1, 0],
  [2.1, 0, 0, 0.979, 0],
  [2.31, 0, 0, 0.649, 0.035],
  [2.45, 0, 0, 0.244, 0.172],
  [2.59, 0, 0, 0.055, 0.563],
  [2.73, 0, 0, 0.003, 0.912],
  [2.94, 0, 0, 0, 1],
]
for (const [sec, r, i, o, wipe] of REF) {
  const p = at(sec)
  near(p.stations[1], r, 0.05, "2nd letter at " + sec + " s")
  near(p.stations[2], i, 0.05, "3rd letter at " + sec + " s")
  near(p.stations[3], o, 0.05, "4th letter at " + sec + " s")
  near(p.wipe, wipe, 0.05, "panel at " + sec + " s")
}

// 5. Moves never overlap: a letter is at rest on a corner before the next move starts.
for (let k = 1; k <= 2; k++) {
  const rest = pwpPose((PWP_HOLD + k - 0.1) / pwpUnits(4), 4).stations
  assert.ok(rest.every((s) => Number.isInteger(s)), "all letters at rest before move " + (k + 1))
}
// The panel only moves once the last letter is on its way home, and reveal fires as it starts.
const first = pwpPose(0, 4).revealAt
near(first, (PWP_HOLD + 2 + PWP_WIPE_AT) / pwpUnits(4), 1e-9, "reveal time")
assert.equal(pwpPose(first - 0.001, 4).wipe, 0, "panel still up just before the reveal")
assert.ok(pwpPose(first + 0.02, 4).wipe > 0, "panel moving just after")
assert.ok(pwpPose(first, 4).stations[3] < 1, "the last letter has left its corner by then")
// Monotonic: no letter ever moves backwards, the panel never rises.
let prev = pwpPose(0, 5)
for (let t = 0.005; t <= 1; t += 0.005) {
  const p = pwpPose(t, 5)
  p.stations.forEach((s, i) => assert.ok(s <= prev.stations[i] + 1e-9, "letter " + i + " moves backwards at " + t))
  assert.ok(p.wipe >= prev.wipe - 1e-9, "panel rises at " + t)
  prev = p
}

// 6. Stations to positions. u: 0 = start of the run, 1 = flush right. v: 0 = bottom line, 1 = top line.
const RISE = 0.42
assert.deepEqual(pwpPoint(0, 4, RISE), { u: 0, v: 0, top: false }, "home")
assert.deepEqual(pwpPoint(1, 4, RISE), { u: 1, v: 0, top: false }, "bottom-right corner")
assert.deepEqual(pwpPoint(2, 4, RISE), { u: 1, v: 1, top: true }, "top-right corner")
assert.deepEqual(pwpPoint(3, 4, RISE), { u: 0, v: 1, top: true }, "top-left corner")
near(pwpPoint(0.5, 4, RISE).u, 0.5, 1e-9, "halfway home along the bottom")
assert.deepEqual(pwpPoint(1.5, 4, RISE), { u: 1, v: 0.5, top: true }, "halfway up the right edge")
near(pwpPoint(2.25, 4, RISE).u, 0.75, 1e-9, "a quarter of the way back along the top")
// The word's position is still measured from home while the letter is on the bottom line,
// and from the gutter once it is not, and the switch happens flush right where both agree.
assert.equal(pwpPoint(1, 4, RISE).u, pwpPoint(1.0001, 4, RISE).u, "no jump where the bottom line hands over to the right edge")
// Other lengths: stations spread over the right and top edges, the last one always top left.
for (const n of [3, 5, 6, 8]) {
  assert.deepEqual(pwpPoint(n - 1, n, RISE), { u: 0, v: 1, top: true }, n + " letters: last letter starts top left")
  assert.deepEqual(pwpPoint(1, n, RISE), { u: 1, v: 0, top: false }, n + " letters: second letter starts bottom right")
  let last = -1
  for (let s = 1; s <= n - 1; s += 0.05) {
    const p = pwpPoint(s, n, RISE)
    const d = p.v < 1 ? p.v * RISE : RISE + (1 - p.u)
    assert.ok(d >= last - 1e-9, n + " letters: path doubles back at station " + s.toFixed(2))
    assert.ok(p.u >= 0 && p.u <= 1 && p.v >= 0 && p.v <= 1, "stays on the edge")
    last = d
  }
}
assert.deepEqual(pwpPoint(1, 2, RISE), { u: 1, v: 0, top: false }, "two letters: the second starts bottom right")
assert.deepEqual(pwpPose(0, 0).stations, [], "an empty word has no letters and still wipes")
assert.equal(pwpPose(1, 0).wipe, 1)

// 7. The width estimate that sizes the word before a canvas is available.
near(pwpAdvance("NOIR"), 2.49, 0.02, "four-letter default is about 2.5 em wide, as in the reference")
assert.ok(pwpAdvance("MW") > pwpAdvance("II") * 2.5, "wide letters count for more")
assert.equal(pwpAdvance(""), 0)

console.log("perimeter-wordmark-preloader: ok")
