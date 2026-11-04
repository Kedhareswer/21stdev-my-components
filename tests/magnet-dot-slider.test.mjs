// Install-safety and physics checks for components/magnet-dot-slider.
// Run: node tests/magnet-dot-slider.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "magnet-dot-slider"
const prefix = ".mds-"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort())
assert.doesNotMatch(src, /\bh-full\b/, "no h-full on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.match(src, /^export default function MagnetDotSlider/m)
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
assert.match(demo, /from "@\/components\/ui\/magnet-dot-slider"/, "the demo imports the installer path")
assert.doesNotMatch(demo, /https?:\/\//, "the demo fetches nothing off-origin")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*(\/\/[^\n]*\n\s*)*"/g, "").replace(/\n\s*\/\/[^\n]*/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(\d+%(,\d+%)*|from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(prefix)), "unscoped selector: " + sel)
}
assert.ok(rules >= 18, "the scope check saw real rules, saw " + rules)
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
const allowed = new Set(["--mds-from", "--mds-to", "--mds-font", "--c"])
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- the per-frame path reads nothing ---------------------------------------------------
const frame = /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/
const paint = src.slice(src.indexOf("const paint = () =>"), src.indexOf("const tick ="))
const tick = src.slice(src.indexOf("const tick ="), src.indexOf("const kick ="))
const move = src.slice(src.indexOf("const onMove ="), src.indexOf("const onUp ="))
for (const [name, body] of [["paint", paint], ["tick", tick], ["onMove", move]]) {
  assert.ok(body.length > 40, name + " found")
  assert.doesNotMatch(body, frame, name + " reads no layout")
}
assert.ok(paint.includes("s.w") && !/\.style\.(width|left|top)\b/.test(paint), "paint uses the stored width and writes transforms only")
const reads = [...src.matchAll(new RegExp(frame, "g"))]
assert.equal(reads.length, 1, "exactly one layout read")
const downAt = src.indexOf("const onDown =")
assert.ok(reads[0].index > downAt && reads[0].index < src.indexOf("const onMove ="), "the track edge is measured once per press")
assert.ok(src.includes("new ResizeObserver") && src.includes("s.w = e.contentRect.width"), "row width from a ResizeObserver")
assert.ok(src.includes("s.raf = requestAnimationFrame(tick)") && src.includes("s.raf = 0"), "the loop stops when it settles")
assert.ok(src.includes("cancelAnimationFrame(s.raf)") && src.includes("ro.disconnect()") && src.includes('mq.removeEventListener("change", on)'), "cleanup")
assert.ok(src.includes("s.reduced ? [s.target, 0]"), "reduced motion jumps without a spring")
assert.ok(src.includes('role="slider"') && src.includes("aria-valuenow={v}") && src.includes("aria-valuetext="), "slider semantics")
for (const k of ["ArrowRight", "ArrowLeft", "PageUp", "PageDown", '"Home"', '"End"']) assert.ok(src.includes(k), "key " + k)
assert.ok(flat.includes("touch-action:pan-y"), "horizontal drags don't scroll the page, vertical swipes still do")

// ---- the lifted physics ------------------------------------------------------------------
const start = src.indexOf("// #region physics")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "physics region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.equal(L.pull(0, 60), 1)
assert.equal(L.pull(60, 60), 0)
assert.equal(L.pull(-90, 60), 0)
assert.ok(L.pull(10, 60) > L.pull(30, 60) && L.pull(30, 60) > 0, "falls off smoothly")
assert.equal(L.pull(-20, 60), L.pull(20, 60), "symmetric")
let p = 0, v = 0
for (let i = 0; i < 120; i++) [p, v] = L.spring(p, v, 1, 1 / 60)
assert.ok(Math.abs(p - 1) < 0.01 && Math.abs(v) < 0.05, "the spring settles in two seconds: " + p)
let peak = 0
;[p, v] = [0, 0]
for (let i = 0; i < 120; i++) { [p, v] = L.spring(p, v, 1, 1 / 60); peak = Math.max(peak, p) }
assert.ok(peak < 1.08, "overshoot stays small: " + peak)
const [p2] = L.spring(0, 0, 1, 5)
assert.ok(p2 < 0.5, "a long frame is clamped, not a teleport")
assert.equal(L.valueAt(0.5, 0, 100, 1), 50)
assert.equal(L.valueAt(0.426, 0, 100, 1), 43)
assert.equal(L.valueAt(0.3, 2700, 6500, 100), 3800)
assert.equal(L.valueAt(-1, 0, 100, 1), 0, "clamped low")
assert.equal(L.valueAt(2, 0, 100, 5), 100, "clamped high")
assert.equal(L.valueAt(0.33, 0, 1, 0.1), 0.3, "decimal steps stay tidy")
assert.equal(L.fracOf(3800, 2700, 6500), 1100 / 3800)
assert.equal(L.fracOf(5, 5, 5), 0)
assert.equal(L.mix("#000000", "#ffffff", 0.5), "#808080")
assert.equal(L.mix("#ffcf6b", "#ff5d3a", 0), "#ffcf6b")

console.log(slug + ": ok")
