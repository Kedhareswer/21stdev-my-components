// Runnable check for the rig maths in components/chrome-dragon-poster, plus the
// install-safety rules the .tsx has to keep.
// Run: node tests/chrome-dragon-poster.test.mjs
//
// WebGL cannot be asserted here. What can — and what breaks silently — is the
// geometry feeding it: a spline that overshoots to a negative radius turns a
// tube inside out, a resampler that drops the last point cuts the tail off, a
// bend test with its sign flipped grows every fin on the inside of the coil,
// and a fit that ignores zoom puts the poster off stage.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/chrome-dragon-poster/chrome-dragon-poster.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region geometry")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "geometry region markers missing")

const js = src.slice(start, end).replace(/:\s*(number|boolean|string|Pt)(\[\])?/g, "")
const {
  POSTER_W,
  POSTER_H,
  clamp01,
  smoothstep,
  hexToRgb,
  catmull,
  resample,
  arcLengths,
  outerSides,
  fitPoster,
  roarEnvelope,
  nearestIndex,
} = await import("data:text/javascript," + encodeURIComponent(js))

const P = (x, y, z = 0.5, r = 0.01) => ({ x, y, z, r })

// ---- helpers ---------------------------------------------------------------
{
  assert.equal(clamp01(NaN), 0)
  assert.equal(clamp01(-1), 0)
  assert.equal(clamp01(2), 1)
  assert.equal(smoothstep(0.3, 0.3, 0.2), 0, "equal edges must not divide by zero")
  assert.equal(smoothstep(0.3, 0.3, 0.4), 1)
  assert.equal(smoothstep(0, 1, 0.5), 0.5)
  assert.ok(Math.abs(POSTER_H / POSTER_W - 1159 / 600) < 1e-9, "the poster keeps the art's proportions")
}

// ---- colour ----------------------------------------------------------------
{
  assert.deepEqual(hexToRgb("#ff0000", [0, 0, 0]), [1, 0, 0])
  assert.deepEqual(hexToRgb("#0f0", [0, 0, 0]), [0, 1, 0])
  assert.deepEqual(hexToRgb("  0000FF ", [0, 0, 0]), [0, 0, 1], "tolerates case, whitespace and a missing #")
  for (const bad of ["red", "#12", "#gggggg", "", undefined, null, "rgb(1,2,3)"]) {
    assert.deepEqual(hexToRgb(bad, [0.1, 0.2, 0.3]), [0.1, 0.2, 0.3], "falls back on " + bad)
  }
}

// ---- splines ---------------------------------------------------------------
{
  const ctrl = [P(0, 0, 0.2, 0.02), P(0.3, 0.1, 0.4, 0.001), P(0.6, 0, 0.6, 0), P(0.9, 0.2, 0.8, 0.03)]
  const c = catmull(ctrl, 10)
  assert.equal(c.length, (ctrl.length - 1) * 10 + 1)
  assert.deepEqual(c[0], ctrl[0], "passes through the first point")
  assert.deepEqual(c[c.length - 1], ctrl[ctrl.length - 1], "and ends on the last")
  assert.deepEqual(c[10], ctrl[1], "and every control point in between")
  for (const p of c) assert.ok(p.r >= 0, "a spline radius went negative: the tube would turn inside out")
  assert.equal(catmull([ctrl[0]], 8).length, 1, "a single point survives")

  const r = resample(c, 0.01)
  const arc = arcLengths(r)
  assert.deepEqual([r[0].x, r[0].y], [0, 0], "resampling keeps the head")
  const last = r[r.length - 1]
  assert.ok(Math.hypot(last.x - 0.9, last.y - 0.2) < 0.0026, "and keeps the tip of the tail")
  for (let i = 1; i < r.length - 1; i++) {
    const d = arc[i] - arc[i - 1]
    assert.ok(Math.abs(d - 0.01) < 5e-4, "uneven spacing " + d + " at " + i)
  }
  for (let i = 1; i < arc.length; i++) assert.ok(arc[i] > arc[i - 1], "arc length must grow")
  assert.deepEqual(resample([], 0.01), [])
  for (const step of [0, -1]) assert.ok(resample([P(0, 0), P(0.001, 0)], step).length < 5000, "a zero step must not loop forever")
}

// ---- fins grow on the outside of each bend ---------------------------------
{
  // A half circle turning counter-clockwise (in y-down screen space it bows
  // toward +y). Its outside is away from the centre.
  const pts = []
  for (let i = 0; i <= 40; i++) {
    const a = Math.PI * (i / 40)
    pts.push(P(Math.cos(a), Math.sin(a)))
  }
  const sides = outerSides(pts, 3)
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1]
    const b = pts[i + 1]
    const l = Math.hypot(b.x - a.x, b.y - a.y)
    const nx = (-(b.y - a.y) / l) * sides[i]
    const ny = ((b.x - a.x) / l) * sides[i]
    // Outward is along the radius, i.e. along the point itself.
    assert.ok(nx * pts[i].x + ny * pts[i].y > 0.9, "fin at " + i + " points into the coil")
  }
  // An S has two bends; the outside swaps once.
  const s = []
  for (let i = 0; i <= 40; i++) s.push(P(i / 40, Math.sin((i / 40) * Math.PI * 2) * 0.2))
  const ss = outerSides(s, 2)
  let flips = 0
  for (let i = 1; i < ss.length; i++) if (ss[i] !== ss[i - 1]) flips++
  assert.equal(flips, 1, "an S flips its outside exactly once")
}

// ---- fitting the poster ----------------------------------------------------
{
  const tall = fitPoster(600, 1159, 1)
  assert.ok(Math.abs(tall.s - 600) < 1e-9 && Math.abs(tall.ox) < 1e-9 && Math.abs(tall.oy) < 1e-6, "the art's own size fits exactly")
  const wide = fitPoster(1600, 900, 1)
  assert.ok(Math.abs(wide.s - 900 / POSTER_H) < 1e-9, "landscape fits by height")
  assert.ok(Math.abs(wide.ox * 2 + wide.s * POSTER_W - 1600) < 1e-6, "and centres horizontally")
  const zoomed = fitPoster(1600, 900, 1.5)
  assert.ok(Math.abs(zoomed.s - wide.s * 1.5) < 1e-9, "zoom scales the poster")
  assert.ok(Math.abs(zoomed.oy * 2 + zoomed.s * POSTER_H - 900) < 1e-6, "and keeps it centred")
  for (const z of [0, -2, NaN]) assert.equal(fitPoster(600, 1159, z).s, 600, "bad zoom falls back to 1 (" + z + ")")
  assert.equal(fitPoster(0, 0, 1).s, 0, "a collapsed stage draws nothing rather than NaN")
}

// ---- the roar --------------------------------------------------------------
{
  assert.equal(roarEnvelope(-1, 1.8), 0, "no roar before it starts")
  assert.equal(roarEnvelope(NaN, 1.8), 0)
  assert.equal(roarEnvelope(1.8, 1.8), 0, "and none after it ends")
  assert.equal(roarEnvelope(99, 1.8), 0)
  let peak = 0
  let prev = 0
  let rising = true
  for (let t = 0; t <= 1.8; t += 0.005) {
    const v = roarEnvelope(t, 1.8)
    assert.ok(v >= 0 && v <= 1, "envelope out of range at " + t)
    if (v < prev - 1e-12) rising = false
    else assert.ok(rising || v <= prev + 1e-12, "the roar swelled twice at " + t)
    peak = Math.max(peak, v)
    prev = v
  }
  assert.ok(peak > 0.99, "the roar reaches full strength")
  assert.ok(roarEnvelope(0.2, 1.8) > 0.95, "and gets there fast")
  assert.ok(Number.isFinite(roarEnvelope(0.01, 0)), "a zero duration must not divide by zero")
}

// ---- anchors ---------------------------------------------------------------
{
  const pts = [P(0, 0), P(1, 0), P(2, 0)]
  assert.equal(nearestIndex(pts, 1.2, 0.3), 1)
  assert.equal(nearestIndex(pts, 9, 9), 2)
}

// ---- the rig ---------------------------------------------------------------
{
  // Every depth has to sit inside the depth range, or the part vanishes.
  const rig = src.slice(src.indexOf("const BODY: Rig"), src.indexOf("/** [cx, cy, rotation"))
  const quads = [...rig.matchAll(/\[(\d+), (\d+), (0\.\d+), ([\d.]+)\]/g)]
  assert.ok(quads.length > 120, "the rig should be populated, saw " + quads.length)
  for (const [, x, y, z, r] of quads) {
    assert.ok(+z > 0.3 && +z < 0.99, "depth " + z + " at " + x + "," + y)
    assert.ok(+r >= 0 && +r < 60, "radius " + r + " at " + x + "," + y)
    assert.ok(+x >= 0 && +x <= 600 && +y >= 0 && +y <= 1159, "rig point " + x + "," + y + " is off the poster")
  }
}

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.ok(imports.length > 0 && imports.every((m) => m === "react"), "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks — build strings with concatenation")
assert.doesNotMatch(code, /\$\{/, "no template placeholders")
assert.doesNotMatch(code, /https?:\/\//, "no remote assets: the capture sandbox blocks them")
assert.doesNotMatch(code, /new Image\(|<img|<video/, "everything is drawn, nothing is loaded")

// Heights: definite lengths only. A percentage collapses to 0px on an
// installed page that has no html/body/#root height chain.
assert.ok(/height = "100svh"/.test(src), "height defaults to a definite length")
const root = src.slice(src.indexOf("<section"), src.indexOf("<canvas"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")
assert.ok(/style=\{\{\s*height,/.test(root), "the root takes the height prop")
assert.ok(/maxWidth: "none"/.test(src), "guard Preflight's canvas max-width")
assert.ok(src.includes("new ResizeObserver"), "a resized box must resize the drawing buffer")
assert.ok(src.includes("canvas.clientWidth"), "the canvas measures its own box")
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 2)"), "cap the pixel ratio")

// WebGL: fail soft, and give everything back on unmount — a route change that
// leaks contexts exhausts them within a few visits.
assert.ok(src.includes('getContext("webgl2"'), "WebGL2")
assert.ok(/if \(!gl\) \{\s*setFailed\(true\)/.test(src), "no WebGL2 must fall back, not throw")
assert.ok(src.includes('"webglcontextlost"'), "a lost context must fall back too")
for (const gone of [
  "cancelAnimationFrame(raf)",
  "observer.disconnect()",
  "io.disconnect()",
  "gl.deleteProgram(skyProgram)",
  "gl.deleteProgram(dragonProgram)",
  "gl.deleteProgram(fxProgram)",
  "gl.deleteBuffer(vbo)",
  "gl.deleteVertexArray(vao)",
  'removeEventListener("webglcontextlost"',
]) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}

// Every uniform a shader declares must be fed by name.
for (const [name, loc] of [["SKY_FS", "us"], ["DRAGON_FS", "ud"], ["DRAGON_VS", "ud"], ["FX_FS", "uf"]]) {
  const block = src.slice(src.indexOf("const " + name + " = ["), src.indexOf('].join("\\n")', src.indexOf("const " + name + " = [")))
  const declared = [...block.matchAll(/"uniform \w+ (u\w+)(\[\d+\])?;"/g)].map((m) => m[1])
  assert.ok(declared.length > 0, name + " declares no uniforms?")
  for (const u of declared) assert.ok(src.includes(loc + '("' + u + '")'), name + " declares " + u + " but nothing uploads it")
}

// Motion: reduced motion is one still frame, redrawn only on change.
assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/if \(!reduced && visible\) raf = requestAnimationFrame\(tick\)/.test(src), "reduced motion must not loop")
assert.ok(/if \(!reduced\) \{\s*L\.roarAt = now/.test(src), "reduced motion must not play the roar")
assert.ok(src.includes("new IntersectionObserver"), "stop drawing off screen")

// Accessibility: the canvas is decoration, the stage is a named, focusable
// image with a keyboard roar.
assert.ok(src.includes('aria-hidden="true"'), "the canvas must be hidden from the tree")
assert.ok(src.includes('role="img"') && src.includes("aria-label="), "the stage must be a named image")
assert.ok(src.includes('className="sr-only"'), "a text description must exist")
assert.ok(src.includes("onKeyDown") && /e\.key === "Enter"/.test(src), "the roar must be keyboard-reachable")

// Only the allowed semantic tokens, if any.
for (const m of src.matchAll(/var\(--([\w-]+)\)/g)) {
  assert.ok(["color-background", "color-foreground", "color-muted-foreground", "color-border", "color-primary"].includes(m[1]), "unknown token --" + m[1])
}

// Demos: a wrapper at width:auto collapses inside 21st's centring flex.
for (const demo of ["demo.tsx", "demo-gold.tsx"]) {
  const d = readFileSync(new URL("../components/chrome-dragon-poster/" + demo, import.meta.url), "utf8")
  assert.ok(d.includes('from "@/components/ui/chrome-dragon-poster"'), demo + " imports the installed path")
  assert.ok(/export default function \w*Demo\w*/.test(d), demo + " default-exports a Demo")
  for (const cls of d.match(/className="[^"]*"/g) ?? []) {
    assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), demo + ": " + cls + " wraps the poster without a width")
  }
}

console.log("chrome-dragon-poster: ok")
