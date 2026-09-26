// Install-safety and timeline check for components/overlook-title-reveal.
// Run: node tests/overlook-title-reveal.test.mjs
//
// The canvas cannot be asserted here. What can — and what breaks silently — is
// the geometry: a cover fit that leaves an edge bare once the pointer drifts
// it, a dilation that stops short of the corners (so the last frame snaps), or
// a title that disappears (or grows off the frame) once the picture is full.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(
  new URL("../components/overlook-title-reveal/overlook-title-reveal.tsx", import.meta.url),
  "utf8",
)

// 21st ships this file alone.
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.ok(src.includes('height = "100svh"'), "stage height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere")
assert.doesNotMatch(src, /@import|<style/, "no stylesheet")
assert.ok(/maxWidth: "none"/.test(src), "guard Preflight's img/svg/canvas max-width")
assert.ok(src.includes("prefers-reduced-motion: reduce"), "reduced motion must be honoured")
assert.ok(src.includes("motion-reduce:animate-none"), "the hint's pulse must stop under reduced motion")
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 2)"), "cap DPR at 2")
assert.ok(src.includes('addEventListener("scroll", onScroll, { passive: true, capture: true })'), "hear scrolls from any ancestor")
for (const gone of [
  "cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()",
  'removeEventListener("scroll", onScroll, { capture: true })', 'removeEventListener("pointermove", onMove)',
]) assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
assert.ok(src.includes('className="sr-only"'), "title and billing must reach screen readers")

// The title never leaves: its keyline is drawn every frame, after the picture,
// and the old construction-line grid is gone.
assert.doesNotMatch(src, /\bLINES\b|octagon|[Cc]onstruction line/, "no grid overlay; the title is the overlay")
{
  const at = src.indexOf("ctx.drawImage(mask, 0, 0)")
  const key = src.indexOf("titleShape(ctx, T.zoom, 0, kw)")
  assert.ok(at > -1 && key > at, "keyline must be drawn over the picture")
  assert.doesNotMatch(src.slice(key - 400, key), /if \(!full|T\.spread < /, "keyline must not switch off at full spread")
  assert.ok(src.includes('outline = "#0b0a0d"'), "keyline defaults to black")
  assert.ok(src.includes("ctx.globalAlpha = ka"), "keyline must fade by keylineAlpha")
  assert.ok(src.includes('mctx.globalCompositeOperation = "destination-out"'), "the veil must be punched out by the title")
}

const demo = readFileSync(new URL("../components/overlook-title-reveal/demo.tsx", import.meta.url), "utf8")
assert.ok(demo.includes('from "@/components/ui/overlook-title-reveal"'), "demo imports the installer path")
assert.ok(demo.includes('className="w-full"'), "demo wrapper needs w-full")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/overlook-title-reveal"'), "tsconfig paths line missing")

// The real logic, lifted out of the component.
const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "logic region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// Scroll → progress.
assert.equal(L.progressFrom(0, 3000, 900), 0)
assert.equal(L.progressFrom(-2100, 3000, 900), 1)
assert.equal(L.progressFrom(-1050, 3000, 900), 0.5)
assert.equal(L.progressFrom(500, 3000, 900), 0, "before the root arrives")
assert.equal(L.progressFrom(-5000, 3000, 900), 1, "after it has gone")
assert.equal(L.progressFrom(-10, 900, 900), 0, "no travel must not divide by zero")

// Timeline: bare title at rest, full poster at the end, lines only once the picture fills.
{
  const a = L.timeline(0)
  assert.deepEqual([a.spread, a.veil, a.credits, a.hint, a.zoom], [0, 0, 0, 1, 1], "rest is the bare title")
  const z = L.timeline(1)
  assert.deepEqual([z.spread, z.veil, z.credits, z.hint], [1, 1, 1, 0], "the end is the poster")
  assert.ok(z.zoom * 0.88 <= 1, "the zoomed title must still fit the frame it was fitted to")
  let prev = L.timeline(0)
  for (let t = 0; t <= 1.0001; t += 0.01) {
    const T = L.timeline(t)
    for (const k of ["spread", "veil", "credits", "zoom"]) assert.ok(T[k] >= prev[k] - 1e-12, `${k} runs backwards at ${t}`)
    prev = T
  }
}

// Dilation: at full spread the stroke reaches every corner from any glyph in the frame.
for (const [w, h] of [[1340, 734], [362, 690], [1900, 400]]) {
  assert.equal(L.dilation(0, w, h), 0)
  assert.ok(L.dilation(1, w, h) / 2 >= Math.hypot(w, h) * 0.6, `dilation too short for ${w}x${h}`)
}

// Keyline: bold at rest, thin and faint over the full picture, never gone.
{
  assert.equal(L.keylineWidth(6, 0), 6)
  assert.ok(Math.abs(L.keylineWidth(6, 1) - 1.8) < 1e-9, "thins to a third")
  assert.equal(L.keylineWidth(2, 1), 1, "never under 1px")
  assert.equal(L.keylineAlpha(0.4, 0), 1)
  assert.ok(Math.abs(L.keylineAlpha(0.4, 1) - 0.4) < 1e-9)
  for (let t = 0; t < 1; t += 0.05) {
    assert.ok(L.keylineWidth(6, t + 0.05) <= L.keylineWidth(6, t) + 1e-9, "width only thins")
    assert.ok(L.keylineAlpha(0.4, t + 0.05) <= L.keylineAlpha(0.4, t) + 1e-9, "alpha only fades")
  }
}

// Cover fit: any parallax offset within ±pad keeps every edge covered.
for (const [fw, fh] of [[1340, 734], [362, 690], [1900, 400], [800, 800]]) {
  const pad = 22
  const f = L.coverFit(fw, fh, pad, 0.56, 0.46)
  assert.ok(Math.abs(f.w / f.h - L.ART_W / L.ART_H) < 1e-9, "aspect kept")
  for (const o of [-pad, 0, pad]) {
    assert.ok(f.x + o <= 1e-9 && f.x + f.w + o >= fw - 1e-9, `x bare at ${fw}x${fh} offset ${o}`)
    assert.ok(f.y + o <= 1e-9 && f.y + f.h + o >= fh - 1e-9, `y bare at ${fw}x${fh} offset ${o}`)
  }
}

// Frame + strip fit the stage.
for (const [w, h] of [[1440, 900], [390, 844], [768, 1024]]) {
  const p = L.posterFrame(w, h)
  assert.equal(p.frame.x * 2 + p.frame.w, w)
  assert.equal(p.frame.y + p.frame.h + p.strip + p.gap, h, "frame + strip + gap fill the height")
}

// Title fitting: monospace-ish fake measure, 55px per char at 100px.
{
  const m = (s) => s.length * 55
  const wide = L.bestLines("LAST CALL", m, 1340, 734, 0.84)
  assert.ok(wide.lines.join(" ") === "LAST CALL", "words kept in order")
  const tall = L.bestLines("LAST CALL", m, 360, 690, 0.84)
  assert.deepEqual(tall.lines, ["LAST", "CALL"], "portrait breaks the title")
  const forced = L.bestLines("ALL WORK\nNO PLAY", m, 1340, 734, 0.84)
  assert.deepEqual(forced.lines, ["ALL WORK", "NO PLAY"], "explicit breaks win")
  for (const r of [wide, tall, forced]) {
    const widest = Math.max(...r.lines.map(m)) * 0.84 * (r.size / 100)
    assert.ok(widest <= 1340 * 0.88 + 1e-6, "title fits the width")
  }
}

// Palette → LUT.
{
  const lut = L.buildLut(["#000000", "#ffffff"])
  assert.equal(lut.length, 768)
  assert.deepEqual([...lut.slice(0, 3)], [0, 0, 0])
  assert.deepEqual([...lut.slice(765)], [255, 255, 255])
  const one = L.buildLut(["#b3241c"])
  assert.deepEqual([...one.slice(0, 3)], [...one.slice(765)], "one stop is a flat ink, not a crash")
  assert.deepEqual(L.hexToRgb("#fff"), [255, 255, 255])
  assert.deepEqual(L.hexToRgb("nope"), [0, 0, 0], "junk falls back to black, not NaN")
}

// Noise is deterministic per seed and stays in 0..1.
{
  const a = L.makeNoise(7)
  const b = L.makeNoise(7)
  for (let i = 0; i < 200; i++) {
    const x = i * 0.37
    const y = i * 0.19
    assert.equal(a(x, y), b(x, y))
    assert.ok(a(x, y) >= 0 && a(x, y) <= 1)
  }
  assert.notEqual(L.makeNoise(8)(1.5, 2.5), a(1.5, 2.5), "seed must change the noise")
}

console.log("overlook-title-reveal: ok")
