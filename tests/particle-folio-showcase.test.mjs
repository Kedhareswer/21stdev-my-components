// Logic and install-safety checks for components/particle-folio-showcase.
// Run: node tests/particle-folio-showcase.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "particle-folio-showcase"
const read = (file) =>
  readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

const a = src.indexOf("// #region particles\n")
const b = src.indexOf("// #endregion particles\n")
assert.ok(a > -1 && b > a, "particles region missing")
const js = stripTypeScriptTypes(src.slice(a, b))
const P = await import("data:text/javascript," + encodeURIComponent(js))

/* ---------- carousel and particle maths ---------- */

assert.equal(P.wrapIndex(-1, 6), 5)
assert.equal(P.wrapIndex(6, 6), 0)
assert.equal(P.wrapIndex(13, 6), 1)
assert.equal(P.wrapIndex(3, 0), 0, "an empty carousel never divides by zero")

assert.equal(P.easeInOutCubic(0), 0)
assert.equal(P.easeInOutCubic(1), 1)
assert.ok(Math.abs(P.easeInOutCubic(0.5) - 0.5) < 1e-9)

// cover crop fills the box and stays inside the image, whatever the aspects
for (const [iw, ih, dw, dh] of [[1280, 880, 340, 234], [400, 1200, 340, 234], [2000, 500, 100, 100], [10, 10, 640, 400]]) {
  const c = P.coverCrop(iw, ih, dw, dh)
  assert.ok(c.sx >= -1e-9 && c.sy >= -1e-9, "crop starts inside the image")
  assert.ok(c.sx + c.sw <= iw + 1e-9 && c.sy + c.sh <= ih + 1e-9, "crop ends inside the image")
  assert.ok(Math.abs(c.sw / c.sh - dw / dh) < 1e-9, "crop keeps the box's aspect")
  assert.ok(Math.abs(c.sw - iw) < 1e-9 || Math.abs(c.sh - ih) < 1e-9, "crop uses the full image along one axis")
}
assert.doesNotThrow(() => P.coverCrop(0, 0, 0, 0))

// the generator is deterministic and stays in 0..1
{
  const r1 = P.mulberry32(42)
  const r2 = P.mulberry32(42)
  for (let i = 0; i < 1000; i++) {
    const v = r1()
    assert.equal(v, r2())
    assert.ok(v >= 0 && v < 1)
  }
}

// every particle has lifted off and landed inside the timeline
for (let i = 0; i < 2000; i++) {
  const x = (i * 37) % 341
  const y = (i * 53) % 235
  const d = P.liftOff(x, y, 340, 234, (i % 100) / 99)
  assert.ok(d >= 0 && d + P.FLIGHT <= 1 + 1e-9, `particle at ${x},${y} lands after t = 1`)
}
// and the wind blows from the left
assert.ok(P.liftOff(0, 100, 340, 234, 0.5) < P.liftOff(340, 100, 340, 234, 0.5), "the left edge goes first")
assert.equal(P.liftOff(5, 5, 0, 0, 0), P.liftOff(5, 5, 0, 0, 0), "a zero-size cover does not produce NaN")

// a particle leaves from home and comes back to it
{
  const s = P.flightOffset(0, 80, -60, 20, 40)
  const e = P.flightOffset(1, 80, -60, 20, 40)
  assert.ok(Math.abs(s.x) < 1e-9 && Math.abs(s.y) < 1e-9, "starts at home")
  assert.ok(Math.abs(e.x) < 1e-9 && Math.abs(e.y) < 1e-9, "lands at home")
  const m = P.flightOffset(0.5, 80, -60, 20, 40)
  assert.ok(Math.hypot(m.x, m.y) > 20, "and is actually away in between")
}

assert.equal(P.initialsOf("Kiln Studio"), "KS")
assert.equal(P.initialsOf("orbit"), "OR")
assert.equal(P.initialsOf("  "), "?")

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no external URLs")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: height/, "the height prop reaches the root")
assert.doesNotMatch(src, /className=\{?"[^"]*\bh-(full|screen)\b[^"]*"\}?\s*\n?\s*style=\{\{\s*\n?\s*minHeight/, "no percentage height on the root")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>, so the 21st CLI tokenizer stays linear")
assert.match(src, /React\.useId\(\)/, "svg ids are namespaced per instance")
for (const m of src.matchAll(/<img\s+(?:src|ref)=[\s\S]*?\/>/g)) {
  assert.match(m[0], /maxWidth: "none"/, "every image is guarded against Preflight")
  assert.match(m[0], /width=\{\d+\}\s+height=\{\d+\}/, "every image has an explicit size")
}
for (const m of src.matchAll(/<svg\b[^>]*>/g)) assert.match(m[0], /maxWidth: "none"/, "every svg is guarded against Preflight")

const css = src.match(/const PFS_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "CSS honours reduced motion")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(",")) assert.match(s.trim(), /^\.pfs-/, `selector escapes the component: ${s.trim()}`)
}

/* ---------- the mat is the sunlit-cutting-mat shader, intact ---------- */

const mat = readFileSync(new URL("../components/sunlit-cutting-mat/sunlit-cutting-mat.tsx", import.meta.url), "utf8")
const shaderBody = (s) => {
  const f = s.match(/const FRAGMENT_SRC = `([\s\S]*?)`/)[1]
  return f.split("\n").map((l) => l.replace(/\/\/.*$/, "").trim()).filter(Boolean).join("\n")
}
assert.equal(shaderBody(src), shaderBody(mat), "the vendored mat shader drifted from sunlit-cutting-mat")
assert.ok(src.includes("webglcontextrestored"), "a dropped context must rebuild")
assert.ok(src.includes("new ResizeObserver"), "a resized box must redraw the mat")
for (const gone of ["gl.deleteProgram(program)", "gl.deleteTexture(texture)", "gl.deleteBuffer(buffer)", "gl.deleteVertexArray(vao)", "observer.disconnect()"]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}
for (const [, name] of src.matchAll(/^uniform\s+\w+\s+(u\w+);/gm)) {
  assert.ok(src.includes(`u("${name}")`), `uniform ${name} is never fed`)
}
assert.ok(src.includes("setMatFailed(true)"), "no WebGL2 must fall back, not paint an empty box")

/* ---------- the dissolve ---------- */

assert.match(src, /draw\(0\)\s*\n\s*canvas\.style\.opacity = "1"/, "the first frame is painted before the canvas is shown")
assert.match(src, /if \(cfg\.current\.reduced \|\| !cover \|\| !canvas\)/, "reduced motion swaps without particles")
assert.match(src, /\.catch\(\(\) => \{/, "a tainted or broken image falls back to a plain swap")
assert.match(src, /run !== runRef\.current/, "a newer step cancels the one in flight")
assert.match(src, /cancelAnimationFrame\(rafRef\.current\)/, "the particle loop is cancelled")
assert.match(src, /e\.key === "ArrowRight"/, "arrow keys step the carousel")
assert.match(src, /aria-label="Next portfolio"/, "the next button is labelled")
assert.match(src, /aria-label="Previous portfolio"/, "the previous button is labelled")

const demo = read("demo.tsx")
assert.match(demo, /className="relative w-full"/, "demo wrapper must be w-full")
assert.doesNotMatch(demo, /https?:\/\//, "the demo paints its covers, no network")

console.log(`${SLUG}: ok`)
