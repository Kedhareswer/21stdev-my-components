// Install-safety and layout checks for components/storage-sweep-meter.
// Run: node tests/storage-sweep-meter.test.mjs
//
// The bar is one canvas driven by a frame loop; the column maths that decides
// how wide each segment is lives in a marked region and is run here as shipped.
import assert from "node:assert/strict"
import { checkComponent, liftRegion } from "./_component-safety.mjs"

const slug = "storage-sweep-meter"
const { src, demo, css } = checkComponent(slug, { prefix: "ssm-", imports: ["react"] })

assert.match(demo, /from "@\/components\/ui\/storage-sweep-meter"/, "demo imports the installed path")

// Pointer-proximity glow only for a real mouse on a fine pointer.
assert.match(src, /\(hover: hover\) and \(pointer: fine\)/, "cursor glow gated to fine pointers")
assert.match(src, /if \(!s\.fine \|\| e\.pointerType !== "mouse"\) return/, "touch never drives the hover lens")

// Reduced motion: the scan and the clear finish in one frame, no embers, no twinkle.
assert.match(src, /s\.scanT \+= reduced \? 99 : dt/, "reduced motion skips the scan")
assert.match(src, /cl\.t \+= reduced \? 99 : dt/, "reduced motion skips the sweep")
assert.match(src, /const tw = reduced \? 1 :/, "reduced motion stops the twinkle")
assert.match(css, /prefers-reduced-motion:reduce\)\{\.ssm-spin/, "spinner stops under reduced motion")

// Preflight would squeeze the overhanging canvas back inside the bar.
assert.match(css, /\.ssm-canvas\{[^}]*max-width:none/, "canvas escapes max-width")
assert.match(src, /new ResizeObserver/, "sized from the observer, not layout reads")
assert.match(src, /io\.disconnect\(\)/, "offscreen pause observer is cleaned up")
assert.match(src, /cancelAnimationFrame\(raf\)/, "frame loop stops on unmount")
assert.match(src, /aria-live="polite"/, "status line is announced")
assert.match(src, /role="img" aria-label=\{"Disk usage: "/, "canvas has a text alternative")
assert.equal((src.match(/type="button"/g) || []).length, 3, "rescan, legend items and the clear action are real buttons")

const m = await liftRegion(src, "model")

// Columns: proportional, never over budget, every non-empty category visible.
for (const cols of [12, 40, 87, 140]) {
  const sizes = [52.6, 41.7, 36.3, 58.6, 44.1, 34.2, 12.6, 46.3, 31.4]
  const out = m.allocateColumns(sizes, 512, cols)
  const sum = out.reduce((a, b) => a + b, 0)
  assert.ok(sum <= cols, cols + ": fits the bar (" + sum + ")")
  assert.ok(out.every((c) => c >= 1), cols + ": no category vanishes")
  if (cols >= 40) assert.ok(Math.abs(sum - Math.round((357.8 / 512) * cols)) <= 1, cols + ": used share matches the disk")
  if (cols >= 87) assert.ok(out[3] > out[6], cols + ": bigger size, wider segment")
}
assert.deepEqual(m.allocateColumns([0, 10, 0], 10, 20), [0, 20, 0], "empty categories take no columns")
assert.deepEqual(m.allocateColumns([1.2], 512, 90), [1], "a near-empty cleared cache keeps a sliver")

assert.equal(m.formatGB(357.84), "357.8 GB")
assert.equal(m.formatGB(-2), "0.0 GB")
assert.equal(m.nextClearable([{ size: 5 }, { size: 46.3, clear: { keep: 1.2 } }, { size: 9, clear: { keep: 0 } }]), 1)
assert.equal(m.nextClearable([{ size: 1.2, clear: { keep: 1.2 } }, { size: 9, clear: { keep: 0 } }]), 1, "skips what's already clear")
assert.equal(m.nextClearable([{ size: 0, clear: { keep: 0 } }]), -1, "nothing left")
assert.deepEqual(m.hexRgb("#f59e0b"), [245, 158, 11])
assert.deepEqual(m.hexRgb("#fff"), [255, 255, 255])
assert.equal(m.easeInOut(0), 0)
assert.equal(m.easeInOut(1), 1)

// Same seed, same pattern: the dot matrix doesn't reshuffle between renders.
const a = m.mulberry32(42), b = m.mulberry32(42)
for (let i = 0; i < 5; i++) assert.equal(a(), b())

console.log(slug + ": ok")
