// Install-safety and plate-physics checks for chladni-plate.
// Run: node tests/chladni-plate.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/chladni-plate/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("chladni-plate.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.ok(!/@import|https?:\/\//.test(src), "nothing fetched")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.ok(!/\bh-full\b/.test(src), "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none"), "the canvas is guarded against Preflight")
assert.ok(src.includes("cp-fallback"), "falls back without WebGL2")
assert.match(src, /swiftshader\|llvmpipe\|software/, "detects a software renderer")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", 'root.removeEventListener("pointermove", onMove)', 'root.removeEventListener("touchmove", onTouchMove)', "gl.deleteProgram(show.pr)", "gl.deleteTexture(den)", "gl.deleteTexture(bg)"]) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.ok(!/console\.|__prof|DBG|uDebug/.test(src), "no debug hooks ship")
const css = src.match(/const CP_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation in the CSS string")
assert.doesNotMatch(css, /(^|[\s}])(\*|body|html|:root)\s*[{,]/m, "no bare global selectors")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
const visible = src.match(/const LABEL = .*$/m)[0] + src.slice(src.lastIndexOf("  return (")) + read("demo.tsx")
assert.ok(!/[—–]/.test(visible), "no em or en dashes in visible text")
const demo = read("demo.tsx")
assert.deepEqual([...demo.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]), ["@/components/ui/chladni-plate"])

// ---- pure helpers, lifted out of the component and executed ----
const region = src.slice(src.indexOf("// #region chladni"), src.indexOf("// #endregion"))
const mod = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(region)))
const { cpRandom, CP_MODES, cpU, cpGrid, cpSample, cpHz, cpNote, cpPick, cpAutoStroke, cpLayout, cpScale, cpGrains, cpScatter, cpStep, cpPlough, CP_WASHER, CP_QUIET } = mod

const a = cpRandom(5)
const b = cpRandom(5)
for (let i = 0; i < 5; i++) assert.equal(a(), b(), "the PRNG is deterministic")

// Every mode: the clamped centre is a node, displacement stays in -1..1, and the gradient matches finite differences.
for (let k = 0; k < CP_MODES.length; k++) {
  assert.ok(Math.abs(cpU(k, 0.5, 0.5)) < 1e-9, "mode " + k + " has a node at the clamp")
  const G = 64
  const grid = cpGrid(k, G)
  const s = new Float32Array(3)
  for (const [x, y] of [[0.13, 0.71], [0.42, 0.37], [0.88, 0.2]]) {
    const u = cpU(k, x, y)
    assert.ok(Math.abs(u) <= 1 + 1e-9)
    const h = 1e-5
    const gx = (cpU(k, x + h, y) - cpU(k, x - h, y)) / (2 * h)
    const gy = (cpU(k, x, y + h) - cpU(k, x, y - h)) / (2 * h)
    const i = Math.round(x * (G - 1))
    const j = Math.round(y * (G - 1))
    const o = (j * G + i) * 3
    const xg = i / (G - 1)
    const yg = j / (G - 1)
    assert.ok(Math.abs(grid[o] - cpU(k, xg, yg)) < 1e-6, "grid holds the displacement")
    const hx = (cpU(k, xg + h, yg) - cpU(k, xg - h, yg)) / (2 * h)
    assert.ok(Math.abs(grid[o + 1] - hx) < 1e-3, "grid holds the x gradient")
    cpSample(grid, G, x, y, s)
    assert.ok(Math.abs(s[0] - u) < 0.08, "bilinear sample is close to the field")
    assert.ok(Number.isFinite(gx) && Number.isFinite(gy))
  }
}
// Modes climb in pitch; notes name correctly.
for (let k = 1; k < CP_MODES.length; k++) assert.ok(cpHz(k) >= cpHz(k - 1), "modes are ordered low to high")
assert.equal(cpNote(440), "A4")
assert.equal(cpNote(261.63), "C4")

// A bow can only drive a mode where the edge actually moves, and faster bows reach higher modes.
for (const [x, y, e] of [[1, 0.3, 0.2], [0, 0.7, 0.6], [0.25, 0, 0.9]]) {
  const k = cpPick(x, y, e)
  assert.ok(Math.abs(cpU(k, x, y)) > 0.05, "never picks a mode with a node under the bow")
}
const slow = cpPick(1, 0.3, 0.05)
const fast = cpPick(1, 0.3, 0.95)
assert.ok(cpHz(fast) > cpHz(slow), "a harder stroke sounds a higher note")
// The automatic stroke always changes the figure, and lands on the one asked for when it can.
for (let k = 0; k < CP_MODES.length; k++) {
  const [s, e] = cpAutoStroke(k, 9)
  const j = cpPick(1, s, e)
  assert.notEqual(j, k, "auto stroke changes the figure from mode " + k)
  if (k !== 9 && k !== 10) assert.equal(j, 9, "auto stroke reaches the preferred figure from mode " + k)
}

// Layout: the plate fits the frame with room to spare, and "aside" leaves a side (or the bottom) free.
for (const [w, h] of [[375, 812], [768, 1024], [1440, 900], [3840, 2160], [320, 240]]) {
  for (const al of ["center", "aside"]) {
    const [cx, cy, S] = cpLayout(w, h, al)
    assert.ok(cx - S / 2 >= 0 && cx + S / 2 <= w && cy - S / 2 >= 0 && cy + S / 2 <= h, "plate inside " + w + "x" + h + " " + al)
    assert.ok(S > Math.min(w, h) * 0.45, "plate is the subject at " + w + "x" + h)
  }
}
const [ax] = cpLayout(1440, 900, "aside")
assert.ok(ax > 720, "aside puts the plate right on wide frames")
const [, ay, aS] = cpLayout(375, 812, "aside")
assert.ok(ay + aS / 2 < 812 * 0.6, "aside leaves the bottom free on phones")

// Pixel budget holds on any screen and lets dpr drop below 1 on huge ones.
for (const [w, h, d] of [[1440, 900, 2], [3840, 2160, 2], [375, 812, 3]]) {
  const sc = cpScale(w, h, d, 2200000)
  assert.ok(w * h * sc * sc <= 2200000 * 1.01, "over budget at " + w + "x" + h)
}
assert.ok(cpScale(3840, 2160, 1, 2200000) < 1)
assert.ok(cpGrains(700, true) < cpGrains(700, false), "software renderers get fewer grains")

// Frame one: grains already sit on the still lines, none on the washer, reproducibly.
const k0 = 13
const pos = cpScatter(k0, 20000, 7)
assert.deepEqual(cpScatter(k0, 20000, 7), pos, "scatter is seeded")
let near = 0
for (let i = 0; i < pos.length; i += 3) {
  const [x, y, z] = [pos[i], pos[i + 1], pos[i + 2]]
  assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1 && z === 0)
  assert.ok(Math.hypot(x - 0.5, y - 0.5) >= CP_WASHER, "no sand on the washer")
  if (Math.abs(cpU(k0, x, y)) < 0.12) near++
}
assert.ok(near / (pos.length / 3) > 0.9, "the first frame is already a figure")

// Physics: a bowed plate moves the sand onto the new figure's still lines, stays finite, and sleeps when quiet.
const G = 128
const grid = cpGrid(9, G)
const p = pos.slice()
const v = new Float32Array(p.length)
const rand = cpRandom(3)
let amp = 0
const onLine = () => {
  let n = 0
  for (let i = 0; i < p.length; i += 3) if (Math.abs(cpU(9, p[i], p[i + 1])) < 0.1) n++
  return n / (p.length / 3)
}
const before = onLine()
for (let f = 0; f < 60 * 5; f++) {
  amp = f < 90 ? Math.min(0.9, amp + 0.05) : amp * Math.exp(-1 / 60 / 1.1)
  cpStep(p, v, grid, G, amp, 1 / 60, rand)
}
assert.ok(p.every(Number.isFinite), "no NaN after ringing")
for (let i = 0; i < p.length; i += 3) assert.ok(p[i] >= 0 && p[i] <= 1 && p[i + 1] >= 0 && p[i + 1] <= 1, "sand stays on the plate")
assert.ok(onLine() > 0.85 && onLine() > before + 0.3, "sand gathers on the new figure: " + before.toFixed(2) + " -> " + onLine().toFixed(2))
const still = p.slice()
for (let i = 0; i < p.length; i++) v[i] = 0
for (let i = 0; i < p.length; i += 3) p[i + 2] = 0
assert.equal(cpStep(p, v, grid, G, CP_QUIET * 0.5, 1 / 60, rand), 0, "a quiet plate has nothing moving")
assert.deepEqual(p, still, "and the sand holds still")

// A fingertip ploughs a clean channel through resting sand.
const q = cpScatter(9, 20000, 2)
const moved = cpPlough(q, 0.1, 0.25, 0.9, 0.25, 0.03, cpRandom(1))
assert.ok(moved > 0)
for (let i = 0; i < q.length; i += 3) {
  if (q[i] > 0.12 && q[i] < 0.88) assert.ok(Math.abs(q[i + 1] - 0.25) >= 0.03 - 1e-9, "the channel is clear")
}

console.log("chladni-plate: ok")
