// Install-safety, shader and turn-physics checks for paper-curl-carousel.
// Run: node tests/paper-curl-carousel.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/paper-curl-carousel/", import.meta.url)
const src = readFileSync(new URL("paper-curl-carousel.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('height = "100svh"'), "height prop defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")

const css = src.match(/const CSS =\n([\s\S]*?)\n\n/)
assert.ok(css, "CSS block is present")
assert.doesNotMatch(css[1], /\$\{|`/, "no backticks or interpolation inside the CSS strings")
const flat = css[1].replace(/"\s*\+\s*\n\s*"/g, "").replace(/^\s*"|"\s*$/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to)$/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".pcc-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(rules > 20, `expected the scope check to see real rules, saw ${rules}`)
assert.match(flat, /\.pcc-canvas,\.pcc-fallback\{[^}]*max-width:none/, "canvas and fallback override Preflight's max-width")
assert.match(flat, /:focus-visible/, "keyboard focus is visible, and only for keyboard users")
assert.match(flat, /@media \(hover:hover\) and \(pointer:fine\)/, "hover styles are gated off touch")
assert.match(flat, /prefers-reduced-motion:reduce/, "caption motion honours reduced motion")
assert.match(src, /prefers-reduced-motion: reduce/, "the turn honours reduced motion")

// Only the semantic tokens in dev/styles.css survive installation.
const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), `token not guaranteed in a host: ${v}`)

// ---- nothing fetched --------------------------------------------------------
// 21st's capture sandbox refuses off-origin requests, and a demo that makes one
// publishes with no video. The component ships no URLs; the published demo
// paints its prints at runtime instead of loading them.
for (const [name, text] of [["component", src], ["demo", demo]]) {
  const urls = [...text.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
  assert.deepEqual(urls, [], `${name} must make no network requests: ${urls.join(", ")}`)
}
assert.doesNotMatch(demo, /<select|<input|<label/, "demo must not ship controls")

// ---- shader -----------------------------------------------------------------
// GLSL ES 1.00 reserves these for future use. Used as an identifier, one fails
// the compile on WebGL1, and the only symptom is the fallback image.
const frag = src.match(/const FRAG = `([\s\S]*?)`/)
assert.ok(frag, "fragment shader is present")
const code = frag[1].replace(/\/\/[^\n]*/g, "")
for (const word of ["flat", "cast", "input", "output", "sample", "filter", "packed", "half", "fixed", "long", "short", "double", "unsigned", "namespace", "using", "sizeof", "union", "enum", "class", "static", "switch", "default", "goto"]) {
  assert.doesNotMatch(code, new RegExp("\\b" + word + "\\b"), `GLSL ES reserved word used in the shader: ${word}`)
}
assert.doesNotMatch(code, /smoothstep\(\s*([^,]+),\s*0\.0\s*,/, "smoothstep with edge0 > edge1 is undefined in GLSL")
for (const u of ["from", "to", "res", "fromAspect", "toAspect", "dir", "fold", "r", "shade", "turning", "paper"]) {
  assert.match(code, new RegExp("uniform \\w+ u_" + u + ";"), `uniform declared: u_${u}`)
  assert.ok(src.includes(`"${u}"`), `uniform looked up: u_${u}`)
}

// ---- autoplay ----------------------------------------------------------------
// Pausing on stage hover meant a full-bleed hero never rotated for desktop
// users: the pointer is always over it. It pauses where the user is about to
// act, and stops for good once they take over.
const paused = src.match(/const paused = ([^\n]+)/)
assert.ok(paused, "pause condition is present")
assert.doesNotMatch(paused[1], /hover/i, "resting the pointer on the stage must not pause autoplay")
for (const reason of ["zone !== 0", "overRail", "focused", "holding", "hidden", "!inView"]) {
  assert.ok(paused[1].includes(reason), `autoplay pauses for: ${reason}`)
}
assert.match(src, /const playing = [^\n]*!stopped/, "a user who took over is never rotated again")
assert.ok((src.match(/setStopped\(true\)/g) ?? []).length >= 4, "drag, keys and both buttons all stop rotation")

// ---- the loop idles -----------------------------------------------------------
assert.match(src, /if \(isMoving\(E\.turn\)\) raf = requestAnimationFrame\(frame\)/, "frames only run while a sheet moves")

// ---- turn geometry and physics (lifted from the #region block) ----------------
const region = src.match(/\/\/ #region curl([\s\S]*?)\/\/ #endregion/)
assert.ok(region, "curl region is present")
const js = region[1]
  .replace(/\): (Vec|Ends|number|boolean) \{/g, ") {")
  .replace(/(\w+): (Vec|number|boolean)/g, "$1")
const M = await import("data:text/javascript," + encodeURIComponent(js))
const { RADIUS: R, wrapIndex, foldDir, foldEnds, dragFoldNext, travelForFoldNext, shouldCommit, shadeFor, springStep, OMEGA_TURN, EXIT_PUSH, LAND_PUSH, FLICK } = M

assert.equal(wrapIndex(5, 5, true), 0, "wraps forward")
assert.equal(wrapIndex(-1, 5, true), 4, "wraps back")
assert.equal(wrapIndex(9, 5, false), 4, "clamps without loop")

for (const tilt of [-0.75, -0.4, 0, 0.4]) {
  const [x, y] = foldDir(tilt)
  assert.ok(Math.abs(Math.hypot(x, y) - 1) < 1e-12, "fold direction is a unit vector")
}

const A = 1.6
const d = foldDir(-0.4)
const e = foldEnds(d, A, R)
const dot = (p) => p[0] * d[0] + p[1] * d[1]
const corners = [[0, 0], [A, 0], [0, 1], [A, 1]]
// Negative tilt lifts the bottom-right corner first, like turning a book page.
assert.equal(Math.max(...corners.map(dot)), dot([A, 0]), "bottom-right corner leads")
assert.ok(corners.every((c) => dot(c) <= e.rest), "at rest no corner is past the fold")
assert.ok(e.gone + R < e.lo, "once gone, the whole roll is past the far edge")
assert.equal(shadeFor(e.gone, e.lo, R), 0, "once gone, no shadow is left behind")
assert.equal(shadeFor(e.lo - R, e.lo, R), 0, "a returning sheet's roll touching the edge casts nothing yet")
assert.equal(shadeFor(e.mid, e.lo, R), 1, "mid-turn shadow is at full strength")

// Dragging: continuous at the knee, never moving the fold backwards.
const knee = Math.PI * R
assert.ok(Math.abs(dragFoldNext(e.rest, knee - 1e-9, R) - dragFoldNext(e.rest, knee + 1e-9, R)) < 1e-6, "no jump at the knee")
let prev = Infinity
for (let t = 0; t < 3; t += 0.01) {
  const f = dragFoldNext(e.rest, t, R)
  assert.ok(f <= prev + 1e-12, `fold moved backwards at travel ${t}`)
  prev = f
  assert.ok(Math.abs(travelForFoldNext(e.rest, f, R) - t) < 1e-9, `travelForFoldNext inverts dragFoldNext at ${t}`)
}
assert.equal(dragFoldNext(e.rest, -1, R), e.rest, "dragging the wrong way lifts nothing")

// Release: a flick decides by direction, anything slower by distance.
assert.equal(shouldCommit(0.05, 0.8, FLICK * 2), true, "a short forward flick commits")
assert.equal(shouldCommit(1.5, 0.8, -FLICK * 2), false, "a flick back cancels a long drag")
assert.equal(shouldCommit(0.9, 0.8, 0), true, "a slow drag past halfway commits")
assert.equal(shouldCommit(0.5, 0.8, 0), false, "a slow drag short of halfway cancels")

// A turn must finish, and finish briskly. Aimed exactly at the edge, a spring
// spends a second creeping the last corner off-stage; this is the loop's own
// arithmetic at 60fps.
const turn = (from, to, push) => {
  let f = from, v = 0, t = 0
  const lo = Math.min(from, to), hi = Math.max(from, to)
  const aim = to + Math.sign(to - from) * push
  while (t < 5) {
    const [x, nv] = springStep(f, v, aim, OMEGA_TURN, 1 / 60)
    f = Math.min(Math.max(x, lo), hi)
    v = f === x ? nv : 0
    t += 1 / 60
    if (f === to) return t
  }
  return Infinity
}
const exit = turn(e.rest, e.gone, EXIT_PUSH)
const land = turn(e.gone, e.rest, LAND_PUSH)
assert.ok(exit < 1.1, `a next turn should finish in about a second, took ${exit.toFixed(2)}s`)
assert.ok(land < 1.3, `a previous turn should land in about a second, took ${land.toFixed(2)}s`)
assert.ok(exit < land, "leaving is quicker than landing")
assert.equal(turn(e.rest, e.gone, 0), Infinity, "without the push the spring never arrives: the push is load-bearing")

console.log("paper-curl-carousel: ok")
