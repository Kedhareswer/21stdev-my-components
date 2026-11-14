// Runnable check for components/scrap-wall-archive: the archive wall's pan, wrap and
// picture choice, and the install-safety rules.
// Run: node tests/scrap-wall-archive.test.mjs
//
// What breaks silently here: a pan that runs out of scraps before the end of the track,
// twin pictures side by side, or a stage whose height collapses once installed.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "scrap-wall-archive"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 200_000, "under 21st's 200 kB component limit: " + statSync(file).size)
assert.match(demo, /from "@\/components\/ui\/scrap-wall-archive"/, "demo imports the installed path")
assert.ok(Buffer.byteLength(demo) < 200_000, "demo under 21st's 200 kB limit")

const imgKeys = new Set([...src.matchAll(/^  ([a-z]\d): IMG_BASE \+ "\1\.webp",?$/gm)].map((m) => m[1]))
assert.equal(imgKeys.size, 18, "eighteen default pictures")
const kinds = JSON.parse(src.match(/const KINDS = (\[[^\]]+\])/)[1])
const names = JSON.parse(src.match(/const SCRAP_NAMES = (\[[^\]]+\])/)[1])
assert.equal(kinds.length, 18)
assert.equal(names.length, kinds.length, "every default picture has a name")
for (const k of kinds) assert.ok(imgKeys.has(k), "default picture has a URL: " + k)
assert.match(src, /items\?: Scrap\[\]/, "items are configurable")
assert.match(src, /items && items\.length \? items : defaultItems\(\)/, "and fall back to the embedded set")
assert.match(src, /title = "Archive"/, "title defaults to the template's text")

assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /calc\(" \+ height \+ " \* " \+ TRACK\.archive \+ "\)/, "the track is TRACK.archive stage heights")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /var\(--color-/, "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, ["https://kedhar-components.pages.dev/bunkum/"], "the only URL is the drawings' base; fonts stay embedded")
assert.equal((src.match(/@font-face\{font-family:Bkm(Sans|Mono)/g) || []).length, 3, "three embedded, renamed font subsets")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /\(hover: hover\) and \(pointer: fine\)/, "fine-pointer gate is read at runtime")
assert.match(src, /if \(ev\.pointerType !== "mouse"\) return/, "touch never drives the context label")
assert.match(src, /ev\.pointerType !== "mouse" \|\| ev\.button !== 0/, "only a mouse drags the wall; touch scrolls the page")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*(\/\*[^*]*\*\/\s*\n\s*)?"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const fonts = src.slice(src.indexOf("const FONTS ="), src.indexOf("const IMG"))
assert.doesNotMatch(fonts, /`|\$\{|@import/, "nor in the font string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{\.bkm-cursor\{display:block\}\}/, "the context label only exists where a mouse can hover")
assert.match(css, /\.bkm-cursor\{display:none/, "and is hidden everywhere else")
assert.match(css, /\.bkm-root svg,\.bkm-root img\{max-width:none\}/, "guards Preflight's img/svg max-width")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((x) => /^(\.dark )?\.bkm-/.test(x.trim())),
    "unscoped selector: " + sel,
  )
}
assert.ok(rules >= 25, "the scope check saw real rules, saw " + rules)

// layout reads: one per frame (the root's box); sizes on resize only
const loopAt = src.indexOf("const frame = (now: number) =>")
const loop = src.slice(loopAt, src.indexOf("const schedule = ()", loopAt))
assert.equal((loop.match(/getBoundingClientRect/g) || []).length, 1, "the frame reads layout exactly once")
assert.doesNotMatch(loop, /offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|innerWidth|innerHeight/, "and nothing else")
assert.equal((src.match(/getBoundingClientRect/g) || []).length, 1, "nowhere else either")
const measureAt = src.indexOf("const measure = () =>")
const measure = src.slice(measureAt, src.indexOf("measure()", measureAt))
assert.match(measure, /offsetHeight/, "the stage and track are measured in measure()")
const outside = src.slice(0, measureAt) + src.slice(src.indexOf("measure()", measureAt))
assert.doesNotMatch(outside, /offset(Top|Left|Width|Height)|client(Width|Height)|getComputedStyle/, "and only there")
assert.match(src, /new ResizeObserver\(measure\)/, "re-measured on resize")

// ---- the wall ------------------------------------------------------------
const A = await liftRegion(src, "archive")

// motion constants carried over unchanged from bunkum-studio-template
assert.equal(A.TRACK.archive, 3.4)
assert.equal(A.GRID_AT, 0.06)
assert.equal(A.ROW, 1.75)
assert.ok(Math.abs(A.pitchFor(1440) - 1440 / 13.5) < 1e-9, "13.5 columns on a desktop, as measured")
assert.equal(A.pitchFor(800), 100, "8 columns on a tablet")
assert.equal(A.pitchFor(450), 100, "4.5 on a phone")
assert.match(src, /approach\(st\.top, rect\.top, dt, 80\)/, "scroll smoothing tau 80 ms")
assert.match(src, /approach\(st\.gx, st\.dragX, dt, 90\)/, "drag pan tau 90 ms")
assert.match(src, /approach\(st\.gy, ty, dt, 90\)/, "scroll pan tau 90 ms")
assert.match(css, /\.bkm-grid\{[^}]*transition:opacity \.45s cubic-bezier\(\.2,\.8,\.2,1\),transform \.45s/, "preview to grid in 450 ms")

// scroll progress
assert.equal(A.progressFrom(0, 2000, 1000), 0)
assert.equal(A.progressFrom(-1000, 2000, 1000), 1)
assert.equal(A.progressFrom(-10, 800, 1000), 0, "no travel, no progress, never NaN")

// wrap: tiles forever, never NaN
assert.equal(A.wrap(-10, 100), 90)
assert.equal(A.wrap(250, 100), 50)
assert.equal(A.wrap(100, 100), 0)
assert.equal(A.wrap(5, 0), 0, "never NaN")
for (const x of [-12345.6, -1, 0, 0.5, 99.9, 7777]) {
  const w = A.wrap(x, 37)
  assert.ok(w >= 0 && w < 37, "in one pitch: " + x)
}

// cellKind: deterministic, in range, neighbour-varied, for the default 18 and for small custom sets
for (const n of [18, 12, 9]) {
  for (let r = -3; r < 6; r++)
    for (let c = -3; c < 8; c++) {
      const k = A.cellKind(c, r, n)
      assert.ok(Number.isInteger(k) && k >= 0 && k < n, "in range")
      assert.equal(k, A.cellKind(c, r, n), "deterministic")
      assert.notEqual(k, A.cellKind(c + 1, r, n), "no twins side by side (n=" + n + ")")
    }
}
const seen = new Set()
for (let r = 0; r < 10; r++) for (let c = 0; c < 16; c++) seen.add(A.cellKind(c, r, 18))
assert.equal(seen.size, 18, "the pool shows every picture")

// gridPanAt: holds still through the preview, then pans many rows
assert.equal(A.gridPanAt(0), 0)
assert.equal(A.gridPanAt(A.GRID_AT), 0, "the grid holds still until the preview has gone")
assert.ok(A.gridPanAt(1) > 10, "and pans many rows by the end")
for (let p = 0.07; p <= 1; p += 0.05) assert.ok(A.gridPanAt(p) > A.gridPanAt(p - 0.01), "monotonic")

// the counter and the preview rows
assert.equal(A.countAt(0), "Scrap 0001 / 1204")
assert.equal(A.countAt(1), "Scrap 1204 / 1204")
assert.deepEqual(A.rowFrom(3, 14, 18), [14, 1, 6])
assert.ok(A.rowFrom(3, 9, 4).every((k) => k >= 0 && k < 4), "rows stay in range for small sets")

console.log("scrap-wall-archive: ok")
