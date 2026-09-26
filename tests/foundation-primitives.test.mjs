// Runnable checks for components/foundation-primitives: the stage layout, the
// camera maths the shape buttons ride on, plus the install-safety rules.
// Run: node tests/foundation-primitives.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/foundation-primitives/", import.meta.url)
const src = readFileSync(new URL("foundation-primitives.tsx", dir), "utf8")
const start = src.indexOf("// #region stage")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "stage region markers missing")
const m = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- layout: shapes never overlap and always fit the frame ---------------------
for (const n of [1, 2, 3, 4, 5, 6]) {
  for (const aspect of [0.6, 1, 1.46, 1.9, 2.8, 3.5, 6]) {
    const L = m.layoutStage(n, aspect)
    assert.equal(L.pts.length, n)
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const d = Math.hypot(L.pts[i][0] - L.pts[j][0], L.pts[i][1] - L.pts[j][1])
        assert.ok(d >= 2.5, `n=${n} aspect=${aspect}: shapes ${i} and ${j} overlap`)
      }
    for (const [x, y] of L.pts) {
      assert.ok(Math.abs(y) + 1.5 <= L.fit, `n=${n} aspect=${aspect}: a shape leaves the frame vertically`)
      assert.ok(Math.abs(x) + 1.5 <= L.fit * aspect, `n=${n} aspect=${aspect}: a shape leaves the frame sideways`)
    }
  }
}
assert.equal(m.layoutStage(5, 2.8).rows, 1, "a wide card keeps one row")
assert.equal(m.layoutStage(5, 1.4).rows, 2, "a phone-width card folds into two rows")
assert.equal(m.layoutStage(3, 1).rows, 1, "three shapes never fold")
assert.equal(m.layoutStage(9, 3).pts.length, m.MAX_SHAPES, "capped at the uniform array size")
// folding makes the shapes bigger on a narrow card, which is the point of it
{
  const one = Math.max(1.75, (4 * m.SPACING / 2 + m.MARGIN) / 1.4)
  assert.ok(m.layoutStage(5, 1.4).fit < one, "two rows frame tighter than one")
}

// ---- plates: neighbouring square tiles join, rows never join -------------------
{
  const pts = m.layoutStage(5, 3).pts
  const s = m.stripsFor(["disc", "square", "square", "square", "none"], pts)
  assert.equal(s.length, 1, "three neighbouring squares are one strip")
  assert.ok(s[0][0] < pts[1][0] - 1 && s[0][1] > pts[3][0] + 1, "the strip covers its shapes")
  assert.ok(s[0][0] > pts[0][0] + 1, "the strip stops before the disc")
  assert.equal(m.stripsFor(["square", "none", "square"], m.layoutStage(3, 3).pts).length, 2, "a gap splits the strip")
  const two = m.layoutStage(5, 1.2).pts
  const t = m.stripsFor(["square", "square", "square", "square", "square"], two)
  assert.equal(t.length, 2, "one strip per row")
  assert.notEqual(t[0][2], t[1][2])
  assert.deepEqual(m.stripsFor([], []), [])
}

// ---- rotation: orthonormal, and zero is identity --------------------------------
{
  assert.deepEqual([...m.rotation(0, 0, 0)].map((v) => Math.round(v * 1e9) / 1e9 + 0), [1, 0, 0, 0, 1, 0, 0, 0, 1])
  for (const [y, p, r] of [[0.3, -0.7, 2], [3, 1.2, -0.4], [-1, 0, Math.PI]]) {
    const R = m.rotation(y, p, r)
    const col = (c) => [R[c * 3], R[c * 3 + 1], R[c * 3 + 2]]
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++) assert.ok(Math.abs(dot(col(a), col(b)) - (a === b ? 1 : 0)) < 1e-6, "rotation is orthonormal")
    const [a, b, c] = [col(0), col(1), col(2)]
    const det = dot(a, [b[1] * c[2] - b[2] * c[1], b[2] * c[0] - b[0] * c[2], b[0] * c[1] - b[1] * c[0]])
    assert.ok(Math.abs(det - 1) < 1e-6, "no mirroring")
  }
  // writes in place at an offset, for the packed uniform array
  const out = new Float32Array(18)
  m.rotation(0, 0, 0, out, 9)
  assert.equal(out[9], 1)
  assert.equal(out[0], 0)
}

// ---- camera: the buttons land on the shapes ------------------------------------
{
  const L = m.layoutStage(5, 3)
  const cam = m.makeCamera(0, 0, L.fit)
  const [cx, cy] = m.project(cam, [0, 0, 0], 900, 300)
  assert.ok(Math.abs(cx - 450) < 1e-6 && Math.abs(cy - 150) < 1e-6, "origin is the centre")
  const [, top, unit] = m.project(cam, [0, L.fit, 0], 900, 300)
  assert.ok(Math.abs(top) < 1e-6, "fit is exactly the half-height at the origin")
  assert.ok(Math.abs(unit - 150 / L.fit) < 1e-6)
  const [rx] = m.project(cam, [2, 0, 0], 900, 300)
  assert.ok(rx > 450, "+x is to the right")
  // unproject is project's inverse on the lens plane, tilted or not
  for (const [yaw, pitch] of [[0, 0], [0.12, -0.08], [-0.15, 0.1]]) {
    const c = m.makeCamera(yaw, pitch, L.fit)
    const [px, py] = m.project(c, [1.3, -0.6, 1.9], 900, 300)
    const [wx, wy] = m.unproject(c, px, py, 900, 300, 1.9)
    assert.ok(Math.abs(wx - 1.3) < 1e-6 && Math.abs(wy + 0.6) < 1e-6, "unproject undoes project")
    const len = (v) => Math.hypot(...v)
    assert.ok(Math.abs(len(c.right) - 1) < 1e-9 && Math.abs(len(c.up) - 1) < 1e-9 && Math.abs(len(c.back) - 1) < 1e-9)
  }
}

// ---- small helpers ----------------------------------------------------------------
assert.deepEqual(m.hexToRgb("#fff"), [1, 1, 1])
assert.deepEqual(m.hexToRgb("#3b74ff").map((v) => Math.round(v * 255)), [59, 116, 255])
assert.equal(m.hexToRgb("oklch(0.7 0.1 250)"), null, "non-hex goes to the canvas reader instead")
assert.equal(m.clamp(5, 0, 1), 1)
assert.ok(Math.abs(m.damp(0, 1, 5, 10) - 1) < 1e-9)
assert.equal(m.damp(0, 1, 5, 0), 0)
for (const k of ["asterisk", "sphere", "halves", "hourglass", "torus", "pill", "cube"])
  assert.ok(Number.isInteger(m.SHAPE_KIND[k]), `${k} has a shader kind`)

// ---- the shader and the defaults agree ------------------------------------------
{
  const frag = src.slice(src.indexOf("const FRAG"), src.indexOf("const REDUCED_QUERY"))
  const declared = [...frag.matchAll(/^uniform\s+\w+\s+(u\w+)/gm)].map((x) => x[1])
  for (const u of declared) assert.ok(src.includes(`loc("${u}")`), `${u} is declared but never located`)
  for (const u of [...src.matchAll(/loc\("(u\w+)"\)/g)].map((x) => x[1])) assert.ok(declared.includes(u), `${u} is located but not declared`)
  assert.ok(/uniform vec4 uPos\[6\]/.test(frag) && /MAX_SHAPES = 6/.test(src), "uniform arrays match MAX_SHAPES")
  for (const k of Object.values(m.SHAPE_KIND)) if (k > 0) assert.ok(frag.includes(`kind == ${k}`), `the shader draws kind ${k}`)
}
{
  const block = src.slice(src.indexOf("export const DEFAULT_ITEMS"), src.indexOf("// #region stage"))
  assert.deepEqual([...block.matchAll(/shape: "(\w+)"/g)].map((x) => x[1]), ["asterisk", "sphere", "halves", "hourglass", "sphere"], "the reference row, in order")
  assert.deepEqual([...block.matchAll(/tile: "(\w+)"/g)].map((x) => x[1]), ["disc", "square", "square", "square", "none"])
}

// ---- install safety ------------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((x) => x[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import|<img\b|fetch\(|new Image\(|url\(["']?http/, "nothing loads at runtime")
assert.ok(!src.includes("$" + "{"), "no template interpolation anywhere")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(/stageHeight = "clamp\(240px, 30vw, 340px\)"/.test(src), "the card height defaults to a definite length")
const root = src.slice(src.indexOf("<section"), src.indexOf("<canvas"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root or the card")
assert.ok(/style=\{\{ height: stageHeight \}\}/.test(src), "the card takes its height from the prop")
assert.ok((src.match(/maxWidth: "none"/g) || []).length >= 2, "Preflight's max-width is overridden on the canvas and the svgs")
assert.ok(/pointer-events-none absolute inset-0 block h-full w-full/.test(src), "the canvas lets the pointer through to the shape buttons")
assert.ok(src.includes("prefers-reduced-motion") && src.includes("motion-reduce:"), "reduced motion is honoured in js and css")
assert.ok(/if \(still\) \{[\s\S]{0,120}a\.vYaw = a\.vPitch/.test(src), "reduced motion: no inertia after a drag")
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "a dropped context rebuilds")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", "themeWatch.disconnect()", "gl.deleteProgram(program)", "gl.deleteVertexArray(vao)"])
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
assert.ok(/React\.useId\(\)/.test(src), "svg gradient ids are unique per instance")
assert.ok(src.includes("aria-pressed") && src.includes("aria-expanded") && src.includes("onKeyDown"), "shapes and rows work from the keyboard")
assert.ok(src.includes('"inert"'), "closed panels keep their controls out of the tab order")

for (const name of ["demo.tsx", "demo-korean.tsx", "demo-custom.tsx"]) {
  const demo = readFileSync(new URL(name, dir), "utf8")
  assert.ok(/className="w-full"/.test(demo), `${name}: wrapper must be w-full`)
  assert.ok(demo.includes('from "@/components/ui/foundation-primitives"'), `${name}: imports the installed path`)
}

console.log("foundation-primitives: ok")
