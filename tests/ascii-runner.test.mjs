// Install-safety + collision checks for ascii-runner.
// Run: node tests/ascii-runner.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/ascii-runner/", import.meta.url)
const src = readFileSync(new URL("ascii-runner.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const shipped = src + demo

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")

// The root is content-sized. A percentage height here collapses to 0px in a
// page with no html/body height chain.
assert.doesNotMatch(src, /minHeight:\s*["']100%["']/, "root must not ask for a percentage height")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")

// Preflight sets max-width:100% on canvas; the canvas sets its own box.
assert.match(src, /maxWidth:\s*["']none["']/, "canvas overrides Preflight max-width")
assert.match(src, /aspectRatio/, "canvas keeps its aspect rather than a fixed height")

assert.match(src, /prefers-reduced-motion/, "honours reduced motion")

// ---- the game must invert with the host theme -------------------------------
// Painting an opaque background punches a white slab into a dark page, which is
// exactly how this looked before. Clear instead, and read the ink off tokens.
assert.doesNotMatch(src, /ctx\.fillRect\(0, 0, W, H\)/, "the canvas must not paint its own background")
assert.match(src, /ctx\.clearRect\(0, 0, W, H\)/, "the canvas is cleared so the host surface shows through")
for (const token of ["--color-foreground", "--color-muted-foreground", "--color-border"]) {
  assert.ok(src.includes(token), `must take its colours from ${token}`)
}
// Only the semantic tokens in dev/styles.css survive installation.
const vars = new Set([...src.matchAll(/var\((--[a-z-]+)/g)].map((m) => m[1]))
const allowed = new Set([
  "--color-background",
  "--color-foreground",
  "--color-muted-foreground",
  "--color-border",
  "--color-primary",
])
for (const v of vars) assert.ok(allowed.has(v), `token is not guaranteed in a host project: ${v}`)

// ---- the scoped <style> block ----------------------------------------------
const css = src.match(/const CSS =\n([\s\S]*?)\n\n/)
assert.ok(css, "CSS block is present")
assert.doesNotMatch(css[1], /\$\{|`/, "no backticks or interpolation inside the CSS strings")
const flat = css[1].replace(/"\s*\+?\s*\n?\s*"/g, "").replace(/^\s*"|"$/gm, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@")) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".ascii-runner-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(rules >= 4, `expected the scope check to see real rules, saw ${rules}`)
assert.match(flat, /:focus-visible/, "keyboard focus is visible, and only for keyboard users")
assert.match(flat, /@media\(hover:hover\)/, "the hover affordance is gated off touch")

// The playfield must leave room under the ground row, or the pebble band
// collides with the footer bar.
const base = Number(src.match(/const BASE = (\d+)/)[1])
const h = Number(src.match(/const H = (\d+)/)[1])
const lowest = Math.max(...[...src.matchAll(/BASE \+ (\d+)/g)].map((m) => Number(m[1])))
assert.ok(h - (base + lowest) >= 12, `only ${h - (base + lowest)}px under the lowest ground mark`)

// ---- keyboard must not be bound to window ----------------------------------
// Bound to window, this swallows Space and the arrows for the whole host page
// from the moment it mounts, so the visitor cannot scroll past the component.
assert.doesNotMatch(
  src,
  /window\.addEventListener\(\s*["'](keydown|keyup)["']/,
  "key handlers must be scoped to the canvas, not to window",
)
assert.match(src, /tabIndex=\{0\}/, "the canvas is focusable, so it can receive keys")
assert.match(src, /onKeyDown=/, "keys are handled on the element")

// ---- the loop stops when there is nothing to animate ------------------------
assert.match(src, /needsNextFrame/, "the frame loop is conditional")
assert.match(
  src,
  /status === "running" \|\|\s*\n?\s*\(gameRef\.current\.status === "ready" && !reducedMotion\)/,
  "game-over is static, so it must not keep requesting frames",
)

// ---- self-contained ---------------------------------------------------------
const urls = [...shipped.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
assert.deepEqual(urls, [], `component and demo must make no network requests: ${urls.join(", ")}`)

// ---- demo -------------------------------------------------------------------
assert.doesNotMatch(demo, /<select|<button|<label|<input/, "demo must not ship controls")
assert.ok(demo.includes("<AsciiRunner"), "demo renders the component")

// ---- collision + scoring (lifted from the #region block) --------------------
const region = src.match(/\/\/ #region logic([\s\S]*?)\/\/ #endregion/)
assert.ok(region, "logic region is present")
const js = region[1]
  .replace(/export function (\w+)\(([^)]*)\): \w+ \{/g, (_m, n, a) => `export function ${n}(${a}) {`)
  .replace(/: ?Box\b/g, "")
  .replace(/: ?string\[\]/g, "")
  .replace(/: ?number/g, "")
  .replace(/: ?boolean/g, "")
const { hit, boxOf, scoreOf, hash } = await import(
  "data:text/javascript," + encodeURIComponent("const LH = 16\n" + js)
)

// Overlap, separation, and the boundary between them.
const a = { x: 0, y: 0, w: 10, h: 10 }
assert.equal(hit(a, { x: 5, y: 5, w: 10, h: 10 }), true, "overlapping boxes collide")
assert.equal(hit(a, { x: 20, y: 0, w: 10, h: 10 }), false, "separated boxes do not")
assert.equal(hit(a, { x: 10, y: 0, w: 10, h: 10 }), false, "touching edges are not a hit")
assert.equal(hit(a, { x: 9.9, y: 0, w: 10, h: 10 }), true, "a hair of overlap is a hit")
assert.equal(hit(a, { x: 0, y: 20, w: 10, h: 10 }), false, "clearing vertically is not a hit")
// symmetric, or the bunny and the obstacle disagree about whether they touched
for (const b of [{ x: 5, y: 5, w: 10, h: 10 }, { x: 20, y: 0, w: 10, h: 10 }]) {
  assert.equal(hit(a, b), hit(b, a), "collision is symmetric")
}

// A jump must actually clear a ground obstacle, or the game is unplayable.
const cw = 9
const ground = boxOf([" @@ ", "@@@@"], 100, 166, cw)
const standing = boxOf(["(\\_/)", "(o.o)", "/   \\"], 95, 166, cw, 3)
assert.equal(hit(standing, ground), true, "standing in the obstacle is a hit")
const airborne = boxOf(["(\\_/)", "(o.o)", " \\ / "], 95, 166 - 60, cw, 3)
assert.equal(hit(airborne, ground), false, "a 60px jump clears it")

// The box is inset, so it never exceeds the glyph block it came from.
const box = boxOf(["@@@@"], 0, 100, cw)
assert.ok(box.w < 4 * cw, "collision box is inset from the glyph block")
assert.ok(box.h > 0 && box.w > 0, "collision box has positive area")

assert.equal(scoreOf(0), 0, "no distance, no score")
assert.equal(scoreOf(1234), 123, "score is distance over ten")
let prev = -1
for (let d = 0; d < 5000; d += 7) {
  const s = scoreOf(d)
  assert.ok(s >= prev, `score went backwards at ${d}`)
  prev = s
}

for (let i = 0; i < 200; i++) {
  const v = hash(i * 1.7)
  assert.ok(v >= 0 && v < 1, `hash left [0,1) at ${i}: ${v}`)
}
assert.equal(hash(42), hash(42), "hash is deterministic, so the ground does not shimmer")

console.log("ascii-runner: ok")
