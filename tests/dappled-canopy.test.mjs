// Install-safety and logic checks for components/dappled-canopy.
// Run: node tests/dappled-canopy.test.mjs
//
// The light itself lives on the GPU and cannot be asserted here. What can fail
// quietly is everything around it: a wind that never gusts or never rests, a
// spring that a stalled tab flings off the wall, a JS unit that drifts from the
// shader's so the pointer stirs the wrong leaves, a preset that names a key
// that does not exist and is silently ignored.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "dappled-canopy"
const read = (f) => readFileSync(new URL(`../components/${SLUG}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|https?:\/\//, "nothing loads at runtime — the light is computed")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*\{/m, "no bare global resets")
assert.doesNotMatch(src, /\bh-(full|screen)\b/, "no percentage height classes")
assert.match(src, /height = "100svh"/, "root height defaults to a definite length")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</,
  "no generics before the JSX (21st CLI tokenizer)",
)
assert.match(src, /maxWidth: "none"/, "the absolute canvas is guarded against Preflight")

// Sized from its own box, never the window.
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("canvas.clientWidth"), "the canvas measures its own box")
assert.ok(src.includes("getBoundingClientRect"), "pointer coordinates are relative to the canvas")
assert.ok(src.includes("new ResizeObserver"), "a resized box must resize the drawing buffer")
assert.ok(src.includes("IntersectionObserver"), "the loop sleeps off-screen")

// Motion is the piece, so reduced motion must stop it, not merely slow it.
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read")
assert.match(src, /if \(reduced \|\| raf \|\| !visible\) return/, "reduced motion never starts the loop")

// No WebGL, a lost context, an unmount: none of them may leave a dead box.
assert.ok(src.includes("setFailed(true)") && src.includes("radial-gradient"), "needs a still fallback")
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "a dropped context rebuilds")
for (const gone of [
  "gl.deleteProgram(program)",
  "gl.deleteBuffer(buffer)",
  "observer.disconnect()",
  "io.disconnect()",
  "cancelAnimationFrame(raf)",
  'root.removeEventListener("pointermove", onMove)',
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}
// The first frame is drawn synchronously, so a still capture is never blank.
assert.match(src, /draw\(\)\n\s*wake\(\)/, "paint before the first rAF")

/* ---------- shader ↔ JS agreement ---------- */

{
  const frag = src.match(/const FRAG = \[([\s\S]*?)\]\.join/)[1]
  const declared = [...frag.matchAll(/"uniform \w+ (u_\w+);"/g)].map((m) => m[1])
  const fed = new Set([
    ...[...src.matchAll(/loc\("(u_\w+)"\)/g)].map((m) => m[1]),
    ...[...src.match(/const COLOR_KEYS = \[([^\]]*)\]/)[1].matchAll(/"(\w+)"/g)].map((m) => "u_" + m[1]),
    ...[...src.match(/const FLOAT_KEYS = \[([^\]]*)\]/)[1].matchAll(/"(\w+)"/g)].map((m) => "u_" + m[1]),
  ])
  for (const u of declared) assert.ok(fed.has(u), `${u} is declared in the shader but nothing uploads it`)
  for (const u of fed) assert.ok(declared.includes(u), `${u} is uploaded but the shader never declares it`)

  // The pointer is converted to wall units in JS; the shader derives the same
  // unit from the resolution. If the two drift, the pointer parts the wrong leaves.
  assert.match(frag, /float m = max\(min\(u_res\.x, u_res\.y\), max\(u_res\.x, u_res\.y\) \* 0\.62\);/)
  assert.match(src, /return Math\.max\(Math\.min\(w, h\), Math\.max\(w, h\) \* 0\.62, 1\)/)

  // A 3×5 search around a 1.2 × 0.42 cell is what keeps a tilted leaf from
  // being clipped into a straight seam. Shrink either and seams come back.
  assert.match(frag, /vec2 cell = vec2\(1\.2, 0\.42\);/)
  assert.match(frag, /for \(int j = -2; j <= 2; j\+\+\)/)
  assert.match(frag, /clamp\(flick \* flut \* 0\.1, -0\.3, 0\.3\)/, "per-leaf twist stays bounded")
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

// colours
assert.deepEqual(L.hexToRgb("#fff"), [1, 1, 1])
assert.deepEqual(L.hexToRgb("#ff0000"), [1, 0, 0])
assert.deepEqual(L.hexToRgb("  #000000 "), [0, 0, 0])
assert.deepEqual(L.hexToRgb("tomato"), [0.5, 0.5, 0.5], "unparseable colours fall back to grey, not NaN")

// noise is smooth, bounded and deterministic
{
  let prev = L.noise1(0, 1)
  for (let t = 0; t <= 50; t += 0.01) {
    const v = L.noise1(t, 1)
    assert.ok(v >= 0 && v <= 1, `noise1 out of range at ${t}`)
    assert.ok(Math.abs(v - prev) < 0.05, `noise1 jumps at ${t}`)
    assert.equal(v, L.noise1(t, 1), "deterministic")
    prev = v
  }
}

// the wind gusts and rests, and never stops entirely
for (const g of [0, 0.5, 1]) {
  let lo = 1, hi = 0
  for (let t = 0; t < 600; t += 0.1) {
    const v = L.gustAt(t, g)
    assert.ok(v >= 0.25 - 1e-9 && v <= 1 + 1e-9, `gust out of range: ${v}`)
    lo = Math.min(lo, v)
    hi = Math.max(hi, v)
  }
  assert.ok(lo <= 0.3, `gustiness ${g}: the breeze must drop to a lull (min ${lo})`)
  if (g > 0) assert.ok(hi >= 0.9, `gustiness ${g}: a gust must come through (max ${hi})`)
}
{
  const mean = (g) => {
    let s = 0, n = 0
    for (let t = 0; t < 600; t += 0.1) { s += L.gustAt(t, g); n++ }
    return s / n
  }
  assert.ok(mean(1) > mean(0.5) && mean(0.5) > mean(0), "more gustiness means more wind")
  assert.equal(L.gustAt(10, -3), L.gustAt(10, 0), "gustiness clamps below")
  assert.equal(L.gustAt(10, 7), L.gustAt(10, 1), "and above")
}

// the spring swings, overshoots a little, and settles
{
  let pos = 0, vel = 1.2, crossed = false
  for (let i = 0; i < 600; i++) {
    ;[pos, vel] = L.springStep(pos, vel, 0, 1 / 60, 7, 2.6)
    if (pos < 0) crossed = true
  }
  assert.ok(crossed, "an underdamped spring overshoots — that wobble is the tree settling")
  assert.ok(Math.abs(pos) < 1e-3 && Math.abs(vel) < 1e-3, `the canopy comes to rest (${pos}, ${vel})`)
}
{
  // A stalled tab hands over one huge dt; sub-stepping keeps it finite and sane.
  let [pos, vel] = L.springStep(0.4, 3, 0, 5, 7, 2.6)
  assert.ok(Number.isFinite(pos) && Number.isFinite(vel), "huge dt stays finite")
  assert.ok(Math.abs(pos) < 2, `huge dt must not fling the canopy (${pos})`)
}

// easing
assert.equal(L.approach(3, 3, 0.016, 2), 3)
assert.ok(Math.abs(L.approach(0, 1, 10, 2) - 1) < 1e-6, "settles")
assert.ok(L.approach(0, 1, 0.016, 2) > 0 && L.approach(0, 1, 0.016, 2) < 1, "never overshoots")

// wall units: the box centre is the origin, the unit never collapses on a phone
assert.deepEqual(L.toWall(0.5, 0.5, 1416, 978), [0, 0])
assert.equal(L.wallUnit(1416, 978), 978, "landscape: the short side is the unit")
assert.ok(Math.abs(L.wallUnit(390, 844) - 844 * 0.62) < 1e-9, "portrait: floored at 62% of the long side")
assert.equal(L.wallUnit(0, 0), 1, "a 0px box never divides by zero")
{
  const [x, y] = L.toWall(1, 1, 1600, 1000)
  assert.ok(Math.abs(x - 0.8) < 1e-9 && Math.abs(y - 0.5) < 1e-9)
}

/* ---------- presets ---------- */

{
  const keys = [...src.match(/export const CANOPY_DEFAULTS: CanopyParams = \{([\s\S]*?)\n\}/)[1].matchAll(/^\s+(\w+):/gm)].map((m) => m[1])
  assert.ok(keys.length >= 20, `expected the defaults to be populated, saw ${keys.length}`)
  const block = src.match(/export const CANOPY_PRESETS[^=]*= \{([\s\S]*?)\n\}/)[1]
  for (const k of block.matchAll(/(\w+):\s*(?=["\d.-])/g)) {
    assert.ok(keys.includes(k[1]), `a preset sets "${k[1]}", which is not a parameter — it would be silently ignored`)
  }
  const names = src.match(/export type CanopyPreset = ([^\n]+)/)[1].match(/"([\w-]+)"/g).map((s) => s.slice(1, -1))
  for (const n of names) assert.ok(block.includes(n.includes("-") ? `"${n}":` : `${n}:`), `preset ${n} is typed but missing`)
  for (const hex of src.matchAll(/(?:wallTop|wallBottom|bounce|light|hot): "([^"]+)"/g)) {
    assert.match(hex[1], /^#[0-9a-f]{6}$/i, `colour ${hex[1]} must be #rrggbb`)
  }
}

/* ---------- demos ---------- */

for (const name of ["demo.tsx", "demo-presets.tsx"]) {
  const demo = read(name)
  assert.match(demo, /from "@\/components\/ui\/dappled-canopy"/, `${name} imports the installer's path`)
  assert.doesNotMatch(demo, /https?:\/\//, `${name} is self-contained, so 21st can capture it`)
  // The outermost wrapper sits in 21st's centring flex; left at width:auto it collapses to 0px.
  const first = demo.match(/return \(\s*(?:\/\/[^\n]*\n\s*)*<div className="([^"]*)"/)
  assert.ok(first && /\bw-full\b/.test(first[1]), `${name}: the outer wrapper needs w-full`)
}

console.log("dappled-canopy: ok")
