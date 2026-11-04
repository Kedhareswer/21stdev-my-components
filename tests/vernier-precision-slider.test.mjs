// Install-safety and vernier-logic checks for components/vernier-precision-slider.
// Run: node tests/vernier-precision-slider.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "vernier-precision-slider"
const prefix = ".vps-"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort())
assert.doesNotMatch(src, /\bh-full\b/, "no h-full on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.match(src, /^export default function VernierPrecisionSlider/m)
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
assert.match(demo, /from "@\/components\/ui\/vernier-precision-slider"/, "the demo imports the installer path")
assert.doesNotMatch(demo, /https?:\/\//, "the demo fetches nothing off-origin")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*(\/\/[^\n]*\n\s*)*"/g, "").replace(/"\s*\+\s*[A-Z]+\s*\+\s*"/g, "18").replace(/\n\s*\/\/[^\n]*/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(\d+%(,\d+%)*|from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(prefix)), "unscoped selector: " + sel)
}
assert.ok(rules >= 20, "the scope check saw real rules, saw " + rules)
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
const allowed = new Set(["--vps-acc", "--vps-font"])
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
assert.ok(paint.includes("s.w") && !/\.style\.(width|left|top|height)\b/.test(paint), "paint uses the stored width and writes transforms only")
const reads = [...src.matchAll(new RegExp(frame, "g"))]
assert.equal(reads.length, 1, "exactly one layout read")
assert.ok(reads[0].index > src.indexOf("const onDown =") && reads[0].index < src.indexOf("const onMove ="), "the track edge is measured once per press")
assert.ok(src.includes("new ResizeObserver") && src.includes("s.w = e.contentRect.width"), "ruler width from a ResizeObserver")
assert.ok(src.includes("s.raf = requestAnimationFrame(tick)") && src.includes("s.raf = 0"), "the loop stops when it settles")
assert.ok(src.includes("Math.min(1 / 30,"), "long frames are clamped")
assert.ok(src.includes("cancelAnimationFrame(s.raf)") && src.includes("ro.disconnect()") && src.includes('mq.removeEventListener("change", on)'), "cleanup")
assert.ok(src.includes("if (s.reduced) {"), "reduced motion jumps without a spring")
assert.ok(src.includes('role="slider"') && src.includes("aria-valuenow={v}") && src.includes("aria-valuetext="), "slider semantics")
for (const k of ["ArrowRight", "ArrowLeft", "PageUp", "PageDown", '"Home"', '"End"', "e.shiftKey"]) assert.ok(src.includes(k), "key " + k)
assert.ok(move.includes("fineFactor(e.clientY - s.startY)"), "vertical distance sets the drag gain")

// ---- the lifted vernier logic ------------------------------------------------------------
const start = src.indexOf("// #region vernier")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "vernier region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.equal(L.fineFactor(0), 1)
assert.equal(L.fineFactor(-20), 1)
assert.equal(L.fineFactor(50), 0.25)
assert.equal(L.fineFactor(-60), 0.25, "above the track counts too")
assert.equal(L.fineFactor(140), 0.1)
assert.equal(L.lens(0), 1)
assert.equal(L.lens(44), 0)
assert.ok(Math.abs(L.lens(22) - 0.5) < 1e-9)
assert.equal(L.snap(21.449, 0, 40, 1), 21.4)
assert.equal(L.snap(21.45, 0, 40, 1), 21.5)
assert.equal(L.snap(-3, 0, 40, 1), 0)
assert.equal(L.snap(99, 0, 40, 2), 40)
assert.equal(L.snap(7.6, 0, 40, 0), 8)
const close = (a, b) => a.every((x, i) => Math.abs(x - b[i]) < 1e-6)
assert.ok(close(L.odometer(93.5, 3, 1), [9, 3, 5]), "settled digits")
assert.ok(close(L.odometer(7, 3, 1), [0, 7, 0]), "leading zero")
assert.ok(close(L.odometer(93.45, 3, 1), [9, 3, 4.5]), "the last place rolls smoothly")
assert.ok(close(L.odometer(93.95, 3, 1), [9, 3.5, 9.5]), "a carry turns the next place only past 9")
assert.ok(close(L.odometer(99.95, 3, 1), [9.5, 9.5, 9.5]), "a double carry turns both")
assert.ok(close(L.odometer(93.2, 3, 1).slice(0, 2), [9, 3]), "higher places hold still mid-digit")
assert.ok(close(L.odometer(-4, 2, 0), [0, 0]), "never negative")

console.log(slug + ": ok")
