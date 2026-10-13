// Install-safety and gravel checks for raked-sand-garden.
// Run: node tests/raked-sand-garden.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/raked-sand-garden/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("raked-sand-garden.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|https?:\/\//, "nothing fetched")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width:none"), "the canvas is guarded against Preflight")
assert.ok(src.includes("rsg-fallback"), "falls back without WebGL2")
for (const gone of ["cancelAnimationFrame(raf)", "clearTimeout(autoTimer)", "ro.disconnect()", "io.disconnect()", "mo.disconnect()", 'root.removeEventListener("pointermove", onMove)', "gl.deleteProgram(program)", "gl.deleteTexture(tex)"]) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.doesNotMatch(src, /console\./, "no debug logging ships")
const css = src.match(/const RSG_CSS = \[([\s\S]*?)\]\.join/)[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation in the CSS string")
assert.doesNotMatch(css, /"(\*|html|body|:root)[\s{,]/, "every rule is scoped under .rsg-")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
const demo = read("demo.tsx")
assert.deepEqual([...demo.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]), ["@/components/ui/raked-sand-garden"])

// ---- pure helpers, lifted out of the component and executed ----
const region = src.slice(src.indexOf("// #region garden"), src.indexOf("// #endregion"))
const mod = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(region)))
const { rsgRandom, rsgCell, rsgNoise, rsgFurrow, rsgStones, rsgLay, rsgStamp, rsgBerm, rsgClearPath, rsgScale } = mod

const a = rsgRandom(7)
const b = rsgRandom(7)
for (let i = 0; i < 5; i++) assert.equal(a(), b(), "the PRNG is deterministic")

for (let i = 0; i < 200; i++) {
  const v = rsgNoise(i * 0.37, i * 0.91)
  assert.ok(v >= 0 && v <= 1, "noise stays in 0–1")
}

assert.equal(rsgFurrow(0, 14, 4), -4, "trough at u = 0")
assert.ok(Math.abs(rsgFurrow(7, 14, 4)) < 1e-9, "ridge half a furrow away")
assert.ok(Math.abs(rsgFurrow(14, 14, 4) - rsgFurrow(0, 14, 4)) < 1e-9, "periodic")

// The grid must resolve a furrow (≥ 4.5 cells) and stay bounded on big screens.
for (const [w, h] of [[320, 568], [1440, 900], [3840, 2160], [1, 1]]) {
  for (const g of [6, 14, 40]) {
    const c = rsgCell(w, h, g)
    assert.ok(c <= g / 4.5 + 1e-9 || c === 1.5, "cell resolves the furrow at " + w + "x" + h)
    assert.ok(c >= 1.5, "cell floor")
    assert.ok(rsgCell(w, h, g, 2) >= 1 && rsgCell(w, h, g, 2) <= c, "finer on high-DPR screens")
  }
}

// Stones stay inside the frame and out of the middle band the first stroke uses.
for (const [w, h] of [[1440, 900], [375, 812]]) {
  const st = rsgStones(5, 3, w, h)
  assert.ok(st.length >= 5)
  for (const s of st) {
    // A group may be cut by the frame, but never lost outside it.
    assert.ok(s.x > -s.r && s.x < w + s.r && s.y > -s.r && s.y < h + s.r, "stone at least touches the frame")
    assert.ok(s.tall > 0 && s.e > 0 && s.moss >= 0, "stone has a shape")
    assert.ok(Math.abs(s.y - h / 2) > h * 0.12, "stone clear of the middle band")
  }
  assert.deepEqual(rsgStones(3, 9, w, h), rsgStones(3, 9, w, h), "stones are seeded")
  assert.equal(rsgStones(0, 9, w, h).length, 0)
  const tops = rsgStones(3, 3, w, h).map((s) => s.tall)
  assert.ok(Math.max(...tops) > Math.min(...tops) * 3, "groups differ: an upright and a flat stone")
}

// Lay a small garden: finite everywhere, stones stand proud, open bed is plain furrows.
const W = 300, H = 200, cell = 2, g = 14, tines = 6, depth = 4
const gw = W / cell, gh = H / cell
const F = new Float32Array(gw * gh * 4)
const stones = [{ x: 60, y: 60, r: 24, e: 0.85, a: 0.4, p1: 1, p2: 2, tall: 0.8, lean: 0, moss: 6 }]
rsgLay(F, gw, gh, cell, stones, g, tines, depth)
let top = -1e9
for (let p = 0; p < gw * gh; p++) {
  assert.ok(Number.isFinite(F[p * 4]), "finite height")
  if (F[p * 4 + 1] > 0.99) top = Math.max(top, F[p * 4])
}
assert.ok(top > 8, "the stone stands above the gravel")
const col = Math.round(260 / cell)
for (let j = 2; j < gh - 2; j++) {
  const hgt = F[(j * gw + col) * 4]
  assert.ok(hgt <= depth * 0.4 && hgt >= -depth * 1.4, "open bed stays within furrow depth")
  assert.equal(F[(j * gw + col) * 4 + 1], 0, "no stone in the open bed")
}

// Rake straight down the bed: across it, fresh furrows one groove apart.
const G = new Float32Array(gw * gh * 4)
for (let y = 10; y <= 190; y += 1.5) rsgStamp(G, gw, gh, cell, 150, y, 0, 1, 3, g, tines, depth)
const row = Math.round(100 / cell)
const prof = []
for (let i = 0; i < gw; i++) prof.push(G[(row * gw + i) * 4])
const troughs = []
for (let i = 1; i < gw - 1; i++) if (prof[i] < prof[i - 1] && prof[i] <= prof[i + 1] && prof[i] < -depth * 0.6) troughs.push(i * cell)
assert.equal(troughs.length, tines, "one furrow per tine")
for (let k = 1; k < troughs.length; k++) assert.ok(Math.abs(troughs[k] - troughs[k - 1] - g) <= cell, "furrows a groove apart")
assert.ok(Math.abs(troughs[0] + troughs[troughs.length - 1] - 300) <= cell * 1.5, "centred on the rake")
assert.equal(prof[5], 0, "gravel beyond the rake is untouched")

// The rake never cuts into a stone, its moss, or the rings round it.
const S = new Float32Array(F)
const before = []
for (let p = 0; p < gw * gh; p++) if (Math.max(S[p * 4 + 1], S[p * 4 + 2], S[p * 4 + 3]) > 0.99) before.push([p, S[p * 4]])
assert.ok(before.length > 400, "the island and its rings are protected")
for (let x = 0; x <= 300; x += 1.5) rsgStamp(S, gw, gh, cell, x, 60, 1, 0, 3, g, tines, depth)
for (const [p, v] of before) assert.equal(S[p * 4], v, "island and rings untouched")
assert.equal(rsgStamp(S, gw, gh, cell, -500, -500, 1, 0, 3, g, tines, depth), null, "off-grid stamp is a no-op")

// Raking across old furrows that sit half a groove out of phase must fully rewrite them.
const O = new Float32Array(gw * gh * 4)
const first = -((tines - 1) / 2) * g
for (let i = 0; i < gw; i++) for (let j = 0; j < gh; j++) O[(j * gw + i) * 4] = rsgFurrow((i + 0.5) * cell - 150 - first - g / 2, g, depth)
for (let y = 10; y <= 190; y += 1.5) rsgStamp(O, gw, gh, cell, 150, y, 0, 1, 3, g, tines, depth)
let deepest = 0
for (let i = 0; i < gw; i++) deepest = Math.min(deepest, O[(row * gw + i) * 4])
assert.ok(deepest <= -depth * 0.95, "fresh furrows reach full depth over out-of-phase ones: " + deepest)
for (let k = 0; k < tines; k++) {
  const x = 150 + first + k * g
  const v = O[(row * gw + Math.floor(x / cell)) * 4]
  assert.ok(v < -depth * 0.8, "trough under tine " + k)
}

// A light press (the start of a stroke) touches a narrower band than a full one.
const P1 = new Float32Array(gw * gh * 4)
const P2 = new Float32Array(gw * gh * 4)
rsgStamp(P1, gw, gh, cell, 150, 100, 0, 1, 3, g, tines, depth, 0.15)
rsgStamp(P2, gw, gh, cell, 150, 100, 0, 1, 3, g, tines, depth, 1)
// The flanks stand as a low shoulder, so old furrows end against a ridge.
const flank = P2[(Math.round(100 / cell) * gw + Math.floor((150 + (g * tines) / 2 + g * 0.25) / cell)) * 4]
assert.ok(flank > depth * 0.15, "a shoulder on the flank: " + flank)
const touched = (A) => { let c = 0; for (let p = 0; p < gw * gh; p++) if (A[p * 4] !== 0) c++; return c }
assert.ok(touched(P1) < touched(P2) * 0.6, "the cap is rounded: a light press is narrower")

// Lifting leaves a crescent of pushed gravel ahead of the head, highest in the middle.
const B = new Float32Array(gw * gh * 4)
rsgBerm(B, gw, gh, cell, 150, 100, 0, 1, g, tines, depth)
const colMax = (x) => { let m = -1e9, at = 0; for (let j = 0; j < gh; j++) { const v = B[(j * gw + Math.floor(x / cell)) * 4]; if (v > m) { m = v; at = j * cell } } return [m, at] }
const [mid, midAt] = colMax(150)
const [side, sideAt] = colMax(150 + g * 2.5)
assert.ok(mid > depth * 0.3, "a berm is left")
assert.ok(midAt > 100 && sideAt > 100, "the berm sits ahead of the head")
assert.ok(midAt > sideAt, "it bows forward in the middle: a crescent")
assert.ok(side < mid * 1.01, "the middle is the highest")

// The opening stroke finds a path clear of every island's rings on a real layout.
for (const [W2, H2] of [[1440, 900], [375, 812], [1024, 768]]) {
  const g2 = Math.max(14, Math.min(26, Math.min(W2, H2) * 0.022))
  const c2 = rsgCell(W2, H2, g2)
  const gw2 = Math.ceil((W2 + 2 * g2) / c2) + 1
  const gh2 = Math.ceil((H2 + 2 * g2) / c2) + 1
  const L2 = new Float32Array(gw2 * gh2 * 4)
  rsgLay(L2, gw2, gh2, c2, rsgStones(3, 3, W2, H2), g2, 6, g2 * 0.3)
  const [py, amp] = rsgClearPath(L2, gw2, gh2, c2, W2, H2, 3 * g2 + g2)
  for (let x = 0; x < W2; x += c2) {
    const e = (x + 0.12 * W2) / (1.24 * W2)
    const cy = py + Math.sin(e * Math.PI * 2) * amp
    for (let o = -3 * g2; o <= 3 * g2; o += c2) {
      const j = Math.floor((cy + o) / c2)
      if (j < 0 || j >= gh2) continue
      assert.ok(L2[(j * gw2 + Math.floor(x / c2)) * 4 + 3] <= 0.01, "opening stroke clears the rings at " + W2 + "x" + H2)
    }
  }
}

// The shadow-marching frame stays inside its pixel budget on any screen, and never goes mushy.
for (const [w, h, d] of [[1920, 1200, 1.25], [2560, 1440, 2], [3840, 2160, 1], [390, 844, 3]]) {
  const k = rsgScale(w, h, d, false)
  assert.ok(w * h * k * k <= 2200000 * 1.0001 || k === 0.5, "over budget at " + w + "x" + h)
  assert.ok(k >= 0.5 && k <= 2)
}
assert.ok(rsgScale(1920, 1080, 1, true) < rsgScale(1920, 1080, 1, false), "software renderer draws fewer pixels")

console.log("raked-sand-garden: ok")
