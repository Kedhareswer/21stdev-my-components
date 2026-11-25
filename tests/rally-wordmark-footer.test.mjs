// Install-safety and physics checks for components/rally-wordmark-footer.
// Run: node tests/rally-wordmark-footer.test.mjs
//
// The glyphs, the ball-and-letter physics and the ghost player live in the one published
// .tsx between `// #region rally` and `// #endregion`; the test lifts that region out,
// strips the types and runs it, so the behaviour is tested as shipped.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "rally-wordmark-footer"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---------- install safety ----------
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the component needs nothing but React")
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.match(demo, /from "@\/components\/ui\/rally-wordmark-footer"/, "demo imports the installed path")
assert.match(src, /^"use client"/, "client component")
assert.match(src, /export default function RallyWordmarkFooter\(/, "default export")
assert.doesNotMatch(src + demo, /\bh-full\b/, "no h-full")
assert.match(src, /\.rwf-root\{[^}]*width:100%/, "root states its width (21st centres demos in a flex row; container-type alone collapses it to 0)")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments")
assert.ok(Buffer.byteLength(src) < 200_000, "component under 21st's 200 kB limit")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /minHeight: height/, "root min-height comes from the prop")
assert.doesNotMatch(src, /kedhar-components|fleet/i, "no reference wordmark, no remote assets")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".rwf-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 20, "the scope check saw real rules, saw " + rules)
const vars = [...new Set([...flat.matchAll(/var\((--[a-z-]+)\)/g)].map((m) => m[1]))].sort()
assert.deepEqual(vars, ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-primary"], "only semantic tokens")
assert.match(flat, /\.rwf-canvas\{position:absolute[^}]*pointer-events:none/, "the canvas never eats clicks meant for links")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read")
assert.match(src, /world\.wobble = !reduce\.matches/, "reduced motion stops the letters swinging")
assert.match(src, /autoPlay && !reduce\.matches/, "reduced motion stops the ghost player")
assert.match(src, /try \{\s*const v = Number\(window\.localStorage/, "storage reads are guarded")
assert.match(src, /IntersectionObserver/, "the loop pauses off screen")
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover exists")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb exists")

// ---------- physics, as shipped ----------
const start = src.indexOf("// #region rally")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "region markers")
const js = stripTypeScriptTypes(src.slice(start, end))
const R = await import("data:text/javascript," + encodeURIComponent(js))
const { makeWorld, step, tap, ghost, layoutWord, glyph, toWorld, toLocal, closest, hitsBall, BALL_R, STROKE } = R

// every advertised letter exists and nothing else
for (const ch of "aefhilnotu") assert.ok(glyph(ch, false), "glyph " + ch)
assert.equal(glyph("z", false), null, "unknown letters are skipped")
const lay = layoutWord("hello")
assert.deepEqual(lay.bodies.map((b) => b.ch).join(""), "hello")
for (let i = 1; i < lay.bodies.length; i++) assert.ok(lay.bodies[i].minX > lay.bodies[i - 1].minX, "letters run left to right")
assert.equal(layoutWord("h?llo").bodies.length, 4, "unsupported characters drop out")
const es = layoutWord("eee").bodies.map((b) => b.strokes[0][0].y)
assert.notEqual(es[0], es[1], "repeated e's alternate their crossbar slant")

// geometry helpers
const c = closest(5, 5, 0, 0, 10, 0)
assert.deepEqual([c.x, c.y], [5, 0])
const body = lay.bodies[0]
body.th = 0.3; body.dx = 7; body.dy = -4
const q = toLocal(body, toWorld(body, { x: 40, y: -100 }))
assert.ok(Math.abs(q.x - 40) < 1e-9 && Math.abs(q.y + 100) < 1e-9, "toLocal inverts toWorld")

const run = (w, secs, fn) => { for (let t = 0; t < secs; t += 1 / 240) { fn && fn(w); step(w, 1 / 240) } }

// at rest the ball sits in the first l's hook and stays there
let w = makeWorld("hello")
const home = { x: w.bx, y: w.by }
const l = w.bodies[2]
assert.ok(home.x > l.minX && home.x < l.maxX + 20, "ball starts in the l")
run(w, 3)
assert.ok(w.alive, "resting ball stays alive")
assert.ok(Math.hypot(w.bx - home.x, w.by - home.y) < 12, "resting ball stays in the hook, moved " + Math.hypot(w.bx - home.x, w.by - home.y).toFixed(1))
assert.ok(w.restTime > 0.35 && w.score === 0, "it reads as at rest")

// a tap launches it straight up about the height of an ascender and counts
assert.ok(hitsBall(w, w.bx + 5, w.by + 10, BALL_R), "a tap on the ball hits")
assert.ok(!hitsBall(w, w.bx + 200, w.by, BALL_R), "a tap far away misses")
tap(w, w.bx, w.by + BALL_R)
assert.equal(w.score, 1)
let top = w.by
run(w, 0.5, (x) => (top = Math.min(top, x.by)))
const rise = home.y - top
assert.ok(rise > 220 && rise < 290, "tap rise matches the reference (about 250 units = 0.22 of the footer width), got " + rise.toFixed(0))

// off-centre taps send it sideways, the way you hit it
w = makeWorld("hello")
tap(w, w.bx + 10, w.by + 10)
assert.ok(w.bvx < 0, "hit on the right sends it left")

// letters swing when hit and settle back
w = makeWorld("hello")
const o = w.bodies[4]
w.bx = (o.minX + o.maxX) / 2 + 60; w.by = -500; w.bvx = 0; w.bvy = 900
let maxTh = 0
run(w, 1, () => (maxTh = Math.max(maxTh, Math.abs(o.th) + Math.hypot(o.dx, o.dy) / 100)))
assert.ok(maxTh > 0.02, "the struck letter moves, got " + maxTh)
w.alive = false; w.respawnAt = 1e9
run(w, 6)
assert.ok(Math.abs(o.th) < 0.005 && Math.hypot(o.dx, o.dy) < 0.5, "and springs back home")

// reduced motion: letters never move
w = makeWorld("hello"); w.wobble = false
w.bx = (o.minX + o.maxX) / 2 + 60; w.by = -500; w.bvy = 900
run(w, 1)
assert.ok(w.bodies.every((b) => b.th === 0 && b.dx === 0), "no wobble under reduced motion")

// a ball knocked off the side drops out, resets the score and comes home
w = makeWorld("hello")
w.score = 4
w.bx = w.walls.r - BALL_R - 1; w.by = 40; w.bvx = 0; w.bvy = 0
run(w, 0.4)
assert.ok(!w.alive && w.score === 0, "fell out, score reset")
run(w, 5)
assert.ok(w.alive && Math.hypot(w.bx - home.x, w.by - home.y) < 20, "respawned ball rolls back into the hook, off by " + Math.hypot(w.bx - home.x, w.by - home.y).toFixed(1))

// walls keep it in the footer
w = makeWorld("hello")
w.bx = w.walls.l + 200; w.by = -400; w.bvx = -2000; w.bvy = -2500
let minX = Infinity, minY = Infinity
run(w, 1, (x) => { minX = Math.min(minX, x.bx); minY = Math.min(minY, x.by) })
assert.ok(minX >= w.walls.l + BALL_R - 1e-6 && minY >= w.walls.t + BALL_R - 1e-6, "left and top walls hold")

// the ghost player rallies after the idle wait, then hands the ball back
w = makeWorld("hello")
let taps = 0
for (let t = 0; t < 20; t += 1 / 240) { if (ghost(w, 1 / 240, 2.4)) taps++; step(w, 1 / 240) }
assert.ok(taps >= 5, "ghost rallied, tapped " + taps)
assert.ok(w.best === 0, "ghost taps never set a best")

// it never tunnels: thousands of random throws, the ball is never left inside a stroke
let seed = 3
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
let deepest = 0
for (let k = 0; k < 120; k++) {
  w = makeWorld("hello")
  w.bx = w.walls.l + rnd() * (w.walls.r - w.walls.l); w.by = -700 + rnd() * 200
  w.bvx = (rnd() - 0.5) * 1400; w.bvy = rnd() * 1200
  run(w, 1.5, (x) => {
    if (!x.alive) return
    for (const b of x.bodies) {
      const p = toLocal(b, { x: x.bx, y: x.by })
      for (const s of b.strokes) for (let i = 0; i < s.length - 1; i++) {
        const cc = closest(p.x, p.y, s[i].x, s[i].y, s[i + 1].x, s[i + 1].y)
        const pen = BALL_R + STROKE / 2 - Math.hypot(p.x - cc.x, p.y - cc.y)
        if (pen > deepest) deepest = pen
      }
    }
  })
}
assert.ok(deepest < 14, "ball never sinks into a stroke, deepest " + deepest.toFixed(1))

console.log("rally-wordmark-footer: all checks passed")
