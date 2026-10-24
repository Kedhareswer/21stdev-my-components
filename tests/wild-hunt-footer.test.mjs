// Install-safety and raster checks for wild-hunt-footer.
// Run: node tests/wild-hunt-footer.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/wild-hunt-footer/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("wild-hunt-footer.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import/, "no @import")
const hosts = new Set([...src.matchAll(/https?:\/\/([a-z0-9.-]+)\//g)].map((m) => m[1]))
assert.deepEqual([...hosts].sort(), ["cdn.jsdelivr.net", "upload.wikimedia.org"], "the only remote origins are the public-domain picture and its matte in this repo, both props")
assert.doesNotMatch(src, /CUTOUT_SHA/, "the cut-out URL is pinned to a real commit")
assert.match(src, /cdn\.jsdelivr\.net\/gh\/Kedhareswer\/21stdev-my-components@[0-9a-f]{40}\/media\/wild-hunt-footer\/riders\.webp/, "the cut-out is pinned by full commit hash")
assert.match(src, /height = "min\(100svh, \d+px\)"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok((src.match(/max-width: none/g) || []).length >= 3, "every canvas and the picture are guarded against Preflight")
assert.ok(src.includes("new ResizeObserver") && src.includes("new IntersectionObserver"), "resizes with its box and starts on scroll-in")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", 'root.removeEventListener("pointermove", onMove)', 'root.removeEventListener("pointerdown", onDown)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.ok(src.includes("<a href="), "links are real anchors")
assert.ok(src.includes('className="whf-sr"'), "the wordmark is readable as text")
assert.ok(src.includes('alt=""') && src.includes("aria-hidden"), "decorative layers are hidden from screen readers")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src, /__whf|window as any/, "no debug hooks ship")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
assert.ok(src.includes("draw(now0())"), "the loop reads its own clock, not the frame timestamp that can predate the start")
for (const f of ["demo.tsx", "demo-cobalt.tsx", "demo-ink.tsx"]) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/wild-hunt-footer"], f + ": imports only the component")
  assert.match(d, /className="w-full"/, f + ": full width inside 21st's flex wrapper")
  const dh = new Set([...d.matchAll(/https?:\/\/([a-z0-9.-]+)\//g)].map((m) => m[1]))
  assert.ok([...dh].every((h) => h === "upload.wikimedia.org" || h === "cdn.jsdelivr.net"), f + ": pictures come from Wikimedia Commons or this repo only")
}

// ---- scoped CSS ----
const css = src.match(/const WHF_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".whf-")), "unscoped selector: " + sel)
}

// ---- the glyphs and the raster helpers ----
const a = src.indexOf("// #region raster\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "raster region missing")
const glyphSrc = src.match(/const WHF_GLYPHS: \{ \[ch: string\]: string \} = \{[\s\S]*?\n\}\n/)[0]
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(glyphSrc.replace("const WHF_GLYPHS: { [ch: string]: string }", "export const WHF_GLYPHS") + src.slice(a, b))))

// Every glyph decodes to 22 rows of its declared width, draws something, and round-trips.
const letters = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&.-'!"]
assert.deepEqual(Object.keys(L.WHF_GLYPHS).sort(), letters.sort(), "the full set of capitals, digits and marks is drawn")
for (const ch of letters) {
  const g = L.whfDecode(L.WHF_GLYPHS[ch])
  assert.equal(g.rows.length, L.WHF_ROWS, ch + ": 22 rows")
  assert.ok(g.rows.every((r) => r.length === g.w), ch + ": every row is the declared width")
  const lit = g.rows.join("").split("#").length - 1
  assert.ok(lit > 4, ch + ": has ink")
  if (/[A-Z0-9]/.test(ch)) assert.ok(g.rows.slice(0, 4).some((r) => r.includes("#")), ch + ": reaches the cap line")
  assert.equal(L.whfPack(g.rows), L.WHF_GLYPHS[ch], ch + ": pack(decode(x)) === x")
  // Ink does not float: a lit cell touches another (8-neighbourhood). The only
  // exceptions are the deliberate lozenge dots inside C, I and J, two at most.
  let lone = 0
  for (let r = 0; r < g.rows.length; r++) for (let c = 0; c < g.w; c++) {
    if (g.rows[r][c] !== "#") continue
    let touch = false
    for (let dy = -1; dy <= 1 && !touch; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue
      const rr = g.rows[r + dy]
      if (rr && rr[c + dx] === "#") { touch = true; break }
    }
    if (!touch) lone++
  }
  assert.ok(lone <= 2, ch + ": " + lone + " stray cells")
}
// Letters share one cap height: stems span the 20-row body.
for (const ch of "HINU") {
  const g = L.whfDecode(L.WHF_GLYPHS[ch])
  assert.ok(g.rows.slice(19, 21).some((r) => r.includes("#")) && g.rows.slice(0, 3).some((r) => r.includes("#")), ch + " spans the body")
}

// Composition: a space is six cells, tracking separates letters, lowercase sets as capitals.
const one = L.whfCompose("H", L.WHF_GLYPHS, 2)
assert.equal(one.cols, 15)
const two = L.whfCompose("HH", L.WHF_GLYPHS, 2)
assert.equal(two.cols, 32)
assert.equal(two.cells.length, one.cells.length * 2)
assert.equal(L.whfCompose("H H", L.WHF_GLYPHS, 2).cols, 15 + 2 + 6 + 2 + 15)
assert.deepEqual(L.whfCompose("huginn", L.WHF_GLYPHS, 2), L.whfCompose("HUGINN", L.WHF_GLYPHS, 2))
assert.equal(L.whfCompose("H?H", L.WHF_GLYPHS, 2).cols, 32, "an unknown character is skipped, not a crash")
assert.deepEqual(L.whfCompose("", L.WHF_GLYPHS, 2), { cols: 0, cells: [] })

// Blocks: a coarser level never has more blocks than cells, and covers every cell.
const blocks8 = L.whfBlocks(one.cells, 8)
assert.ok(blocks8.length <= one.cells.length && blocks8.length > 0)
for (let i = 0; i < one.cells.length; i += 2) {
  const bx = Math.floor(one.cells[i] / 8), by = Math.floor(one.cells[i + 1] / 8)
  let found = false
  for (let j = 0; j < blocks8.length; j += 2) if (blocks8[j] === bx && blocks8[j + 1] === by) found = true
  assert.ok(found, "cell covered by a block")
}
assert.equal(L.whfBlocks(one.cells, 1).length, one.cells.length, "level 1 is the cells themselves")

// Dissolve profile: clear above the start, fully red from start + span, monotonic between.
assert.equal(L.whfDissolve(0, 0.4, 0.28), 0)
assert.equal(L.whfDissolve(0.4, 0.4, 0.28), 0)
assert.equal(L.whfDissolve(0.68, 0.4, 0.28), 1)
assert.equal(L.whfDissolve(1, 0.4, 0.28), 1)
assert.ok(Math.abs(L.whfDissolve(0.54, 0.4, 0.28) - 0.5) < 1e-9, "eased midpoint")
let prev = -1
for (let y = 0; y <= 1; y += 0.01) { const v = L.whfDissolve(y, 0.4, L.WHF_SPAN); assert.ok(v >= prev - 1e-12); prev = v }
assert.equal(L.whfDissolve(1, 2, 0.28), 1, "a start past the bottom is clamped")
assert.equal(L.whfDissolve(0.5, 0.4, 0), 1, "a zero span is a hard edge")

// Hash: deterministic, in range, and different across buckets.
assert.equal(L.whfHash(12, 3), L.whfHash(12, 3))
assert.notEqual(L.whfHash(12, 3), L.whfHash(12, 4))
for (let i = 0; i < 500; i++) { const v = L.whfHash(i, i * 7); assert.ok(v >= 0 && v < 1) }

// Coordinates: A1 at the origin, P9 at the far corner, clamped beyond.
assert.equal(L.whfCoord(0, 0, 1440, 800), "A1")
assert.equal(L.whfCoord(1439, 799, 1440, 800), "P9")
assert.equal(L.whfCoord(5000, 5000, 1440, 800), "P9")
assert.equal(L.whfCoord(720, 400, 1440, 800), "I5")

// The flourish is a valid path that starts left of the box and ends right of it.
const d = L.whfSwash(800, 176, 90)
assert.match(d, /^M -?[\d.]+ -?[\d.]+( C( -?[\d.]+ -?[\d.]+){3})+$/)
assert.ok(parseFloat(d.split(" ")[1]) < 0, "starts left of the word")
assert.ok(parseFloat(d.split(" ").at(-2)) > 800, "ends right of the word")
const xs = d.replace(/[MC]/g, "").trim().split(/\s+/).map(parseFloat).filter((_, i) => i % 2 === 0)
assert.ok(Math.min(...xs) >= -90 - 1e-6, "never further left than the overshoot")
assert.ok(Math.max(...xs) <= 800 + 90 + 1e-6, "never further right than the overshoot")

assert.deepEqual(L.whfHex("#e2281b"), [226, 40, 27])
assert.deepEqual(L.whfHex("#fff"), [255, 255, 255])
assert.equal(L.whfHex("tomato"), null)

console.log("wild-hunt-footer: ok")
