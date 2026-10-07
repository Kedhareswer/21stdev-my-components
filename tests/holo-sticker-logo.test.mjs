// Runnable checks for components/holo-sticker-logo: the peel geometry, the
// stroke morph and the springs, lifted out of the component's `#region sticker`
// and executed; then the install-safety rules, asserted against the source.
// Run: node tests/holo-sticker-logo.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/holo-sticker-logo/", import.meta.url)
const src = readFileSync(new URL("holo-sticker-logo.tsx", dir), "utf8")
const demos = ["demo", "demo-studio"].map((n) => readFileSync(new URL(n + ".tsx", dir), "utf8"))
const readme = readFileSync(new URL("README.md", dir), "utf8")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

const start = src.indexOf("// #region sticker")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "sticker region markers missing")
const js = src
  .slice(start, end)
  .replace(/:\s*\{ [a-z]+: number(; [a-z]+: number)* \}/g, "")
  .replace(/:\s*Record<[^>]*>/g, "")
  .replace(/:\s*\[number(, number)*\]/g, "")
  .replace(/ as GlyphStroke/g, "")
  .replace(/:\s*(number|string|GlyphStroke|GlyphName)(\[\])*/g, "")
const m = await import("data:text/javascript," + encodeURIComponent(js))

const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`)

// ---- clamp ----------------------------------------------------------------
assert.equal(m.clamp(5, 0, 1), 1)
assert.equal(m.clamp(-5, 0, 1), 0)
assert.equal(m.clamp(NaN, 0, 1), 0, "NaN must not reach a uniform")

// ---- strokes ----------------------------------------------------------------
{
  // An arc as one cubic: ends exact, and the curve stays on the circle.
  for (const span of [40, 90, 120, 140]) {
    const s = m.arc(50, 50, 30, -span / 2, span / 2, 10)
    near(Math.hypot(s[0] - 50, s[1] - 50), 30, 1e-9, "arc starts on the circle")
    near(Math.hypot(s[6] - 50, s[7] - 50), 30, 1e-9, "arc ends on the circle")
    for (let t = 0; t <= 1; t += 0.05) {
      const [x, y] = m.bezierPoint(s, t)
      near(Math.hypot(x - 50, y - 50), 30, 30 * 0.006, `arc of ${span}° leaves its radius at t=${t}`)
    }
  }
  // A line is a cubic with its handles on the segment, so it can morph.
  const l = m.line(10, 20, 70, 50, 8)
  for (const [x, y] of [[l[2], l[3]], [l[4], l[5]]]) {
    near((x - 10) * 30 - (y - 20) * 60, 0, 1e-9, "line handles sit on the segment")
  }
  near(m.strokeLength(l), Math.hypot(60, 30), 1e-9, "a line's length is its length")
}

// ---- the presets ------------------------------------------------------------
{
  const names = Object.keys(m.GLYPHS)
  assert.deepEqual(names.sort(), ["bars", "broadcast", "play", "smile", "spark", "waves"])
  for (const [name, strokes] of Object.entries(m.GLYPHS)) {
    // Same count everywhere is what makes every preset pair a true morph.
    assert.equal(strokes.length, 3, `${name} must have three strokes`)
    for (const s of strokes) {
      assert.equal(s.length, 9, `${name}: a stroke is 8 coordinates and a width`)
      assert.ok(s.every(Number.isFinite), `${name}: non-finite value`)
      for (let i = 0; i < 8; i++) assert.ok(s[i] >= 0 && s[i] <= 100, `${name}: leaves the 100 box: ${s[i]}`)
      assert.ok(s[8] > 0, `${name}: zero-width stroke`)
    }
  }
}

// ---- morph --------------------------------------------------------------
{
  const a = m.GLYPHS.waves
  const b = m.GLYPHS.play
  assert.deepEqual(m.morphStrokes(a, b, 0, 0.12), a, "t=0 is the first mark")
  for (const [x, y] of m.morphStrokes(a, b, 1, 0.12).map((s, i) => [s, b[i]])) {
    for (let j = 0; j < 9; j++) near(x[j], y[j], 1e-9, "t=1 is the second mark")
  }
  // The anticipation must never take a width negative — and it would, for a
  // stroke growing out of a zero-width point.
  for (let t = 0; t <= 1; t += 0.01) {
    for (const s of m.morphStrokes(a, b, t, 0.12)) assert.ok(s[8] >= 0, `negative width at t=${t}`)
    for (const s of m.morphStrokes(a.slice(0, 1), a, t, 0.12)) assert.ok(s[8] >= 0, `negative width growing at t=${t}`)
  }
  // Different stroke counts still align: the extra grows from a point.
  const [A, B] = m.alignStrokes(a.slice(0, 1), a)
  assert.equal(A.length, 3)
  assert.equal(B.length, 3)
  assert.equal(A[2][8], 0, "a missing stroke starts with no width")
  const mid = m.bezierPoint(a[2], 0.5)
  near(A[2][0], mid[0], 1e-9, "and at its partner's midpoint")
  near(A[2][1], mid[1], 1e-9, "and at its partner's midpoint")
  // Ease endpoints, and the anticipation it is there for.
  near(m.easeInOutBack(0), 0, 1e-12, "ease starts at 0")
  near(m.easeInOutBack(1), 1, 1e-12, "ease ends at 1")
  assert.ok(m.easeInOutBack(0.12) < 0, "strokes pull back before they travel")
  assert.ok(m.easeInOutBack(0.88) > 1, "and overshoot before they land")
}

// ---- the peel -------------------------------------------------------------
{
  const R = 0.15
  for (const ang of [0, 48, 132, 225]) {
    const a = (ang * Math.PI) / 180
    const c = [Math.cos(a), Math.sin(a)]
    for (const [qx, qy] of [m.restCorner(ang, 0.3), m.restCorner(ang, 0.6), [0, 0], [c[0] * 0.2 - 0.3, c[1] * 0.2 + 0.1]]) {
      const g = m.peelGeometry(ang, qx, qy, R)
      near(Math.hypot(g.dx, g.dy), 1, 1e-9, "peel direction is a unit vector")
      assert.ok(g.r <= R + 1e-12, "curl never exceeds its radius")
      // The corner, rolled round the cylinder and laid back, lands on the drag point.
      const s = c[0] * g.dx + c[1] * g.dy - g.fold
      near(m.landing(s, g.r), qx * g.dx + qy * g.dy - g.fold, 1e-9, `corner must land on the pointer at ${ang}°`)
    }
    // No drag, no fold: the first pixel of a peel does not jump.
    const g0 = m.peelGeometry(ang, c[0] - 1e-3 * c[0], c[1] - 1e-3 * c[1], R)
    near(g0.fold, 1, 2e-3, "a tiny pull folds right at the corner")
    assert.ok(g0.r < 1e-3, "with a tiny curl")
    assert.ok(m.peelGeometry(ang, c[0], c[1], R).fold > 2, "no pull, no fold on the sheet")
    near(m.restCorner(ang, 0)[0], c[0], 1e-12, "peel 0 rests flat")
    near(m.restCorner(ang, 0)[1], c[1], 1e-12, "peel 0 rests flat")
  }
  // landing is continuous where the roll begins and where it lays back flat.
  near(m.landing(1e-9, R), 0, 1e-8, "continuous at the fold")
  near(m.landing(Math.PI * R - 1e-9, R), m.landing(Math.PI * R + 1e-9, R), 1e-8, "continuous where the roll lays back")
  // The drag is kept on the sheet.
  for (const [x, y] of [[3, 3], [-4, 1], [0.99, 0.2], [0.7, 0.75]]) {
    const [cx, cy] = m.clampDrag(48, x, y)
    assert.ok(Math.hypot(cx, cy) <= 1.2 + 1e-9, "drag stays near the sheet")
    const a = (48 * Math.PI) / 180
    assert.ok(cx * Math.cos(a) + cy * Math.sin(a) <= 0.98 + 1e-9, "the corner is never folded outward")
  }
}

// ---- springs settle at a slow frame rate ------------------------------------
for (const [k, c] of [[300, 30], [170, 13], [120, 10], [80, 8.5], [60, 11]]) {
  let x = 0
  let v = 0
  for (let i = 0; i < 30 * 6; i++) [x, v] = m.springStep(x, v, 1, k, c, 1 / 30)
  near(x, 1, 1e-3, `spring k=${k} c=${c} must settle at 30 fps`)
}

// ---- view + colour ----------------------------------------------------------
for (let ax = -30; ax <= 30; ax += 6) {
  for (let ay = -30; ay <= 30; ay += 6) {
    const v = m.viewFromTilt(ax, ay)
    near(Math.hypot(...v), 1, 1e-9, "view must be a unit vector")
  }
}
assert.deepEqual(m.hexToRgb("#fff", [0, 0, 0]), [1, 1, 1])
assert.deepEqual(m.hexToRgb("#000000", [1, 1, 1]), [0, 0, 0])
assert.deepEqual(m.hexToRgb("green", [0.1, 0.2, 0.3]), [0.1, 0.2, 0.3], "bad input falls back")

// ---- the shader inverts landing() --------------------------------------------
assert.ok(src.includes("s = PI * R - d;"), "flap laid back: s = πR − d")
assert.ok(src.includes("float th = PI - asin(clamp(d / R, 0.0, 1.0));"), "top of the roll")
assert.ok(src.includes("float th = asin(clamp(d / R, 0.0, 1.0));"), "underside of the roll")
assert.ok(/gl_VertexID & 2\) \* 2\.0 - 1\.0/.test(src), "the fullscreen triangle must be oversized")

// ---- install safety -----------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((x) => x[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /https?:\/\/(?!www\.w3\.org)/, "nothing fetched: every pixel is drawn in the file")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"') && src.includes("aria-valuenow={pct}"), "reports progress")
assert.ok(src.includes("onLoadedRef.current"), "onLoaded through a ref, not an effect dependency")
assert.doesNotMatch(src, /console\./, "no debug logging ships")

const css = src.match(/const CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.match(css[1], /\.hsk-root canvas, \.hsk-root svg \{ max-width: none; \}/, "Preflight guard")
for (const x of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = x[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".hsk-")), `unscoped selector: ${sel}`)
}
// view-box puts the reference box's origin at user (0,0), which for a
// -100..100 viewBox is the centre. 50% 50% would be (100,100) and swings the
// progress arc and the die line off the sticker.
assert.ok(css[1].includes(".hsk-press * { transform-box: view-box; transform-origin: 0 0; }"), "press marks rotate about the centre")

for (const gone of [
  "cancelAnimationFrame(raf)",
  "observer.disconnect()",
  "io.disconnect()",
  "gl.deleteProgram(program)",
  "gl.deleteTexture(tex)",
  "gl.deleteVertexArray(vao)",
  "gl.deleteShader(vs)",
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "a lost context rebuilds")
assert.ok(src.includes("setFailed(true)") && src.includes("hsk-fallback"), "no WebGL2 falls back, not black")
assert.ok(src.includes("canvas.clientWidth") && src.includes("new ResizeObserver"), "sized from its own box")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "never from the window")
assert.ok(src.includes('aria-label={label + ": " + glyph.name'), "the sticker is a named control")
assert.ok(src.includes('ev.key === "ArrowRight"'), "and keyboard operable")

// ---- wiring -------------------------------------------------------------------
assert.ok(
  tsconfig.includes('"@/components/ui/holo-sticker-logo": ["./components/holo-sticker-logo/holo-sticker-logo.tsx"]'),
  "tsconfig paths line",
)
for (const d of demos) assert.ok(d.includes('from "@/components/ui/holo-sticker-logo"'), "demos import the installed path")
for (const text of [src, readme, ...demos]) assert.doesNotMatch(text, /spotify/i, "no third-party brand ships")

console.log("holo-sticker-logo: ok")
