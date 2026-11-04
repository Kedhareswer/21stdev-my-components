// Install-safety and dock-logic checks for components/titanium-dock.
// Run: node tests/titanium-dock.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "titanium-dock"
const prefix = ".tdk-"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort())
assert.doesNotMatch(src, /\bh-full\b/, "no h-full on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.match(src, /^export default function TitaniumDock/m)
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
assert.match(demo, /from "@\/components\/ui\/titanium-dock"/, "the demo imports the installer path")
assert.doesNotMatch(demo, /https?:\/\//, "the demo fetches nothing off-origin")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
// numbers are spliced in with + SIZE + etc; collapse those joins too
const flat = css.replace(/"\s*\+\s*(\/\/[^\n]*\n\s*)*"/g, "").replace(/"\s*\+\s*[^"\n]+?\s*\+\s*"/g, "0").replace(/\n\s*\/\/[^\n]*/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(\d+%(,\d+%)*|from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(prefix)), "unscoped selector: " + sel)
}
assert.ok(rules >= 20, "the scope check saw real rules, saw " + rules)
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
const allowed = new Set(["--tdk-a", "--tdk-b", "--tdk-c", "--tdk-ink", "--tdk-dim", "--tdk-line", "--tdk-shadow", "--tdk-hx", "--tdk-i", "--tdk-sx", "--tdk-rot", "--tdk-m", "--tdk-mag", "--tdk-s", "--tdk-g", "--n"])
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- runtime hygiene and a11y --------------------------------------------------------
const reads = [...src.matchAll(/getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/g)]
assert.equal(reads.length, 1, "exactly one layout read")
const measureAt = src.indexOf("const measure = () =>")
assert.ok(reads[0].index > measureAt && reads[0].index < measureAt + 200, "the read lives in measure()")
assert.ok(src.includes("onPointerEnter={measure}"), "measured on enter, not per move")
const move = src.slice(src.indexOf("const onMove"), src.indexOf("const onLeave"))
assert.ok(move.includes("barLeft.current") && move.includes("centreOf(i)") && !/getBoundingClientRect/.test(move), "moves use the cache and pure maths")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS")
assert.ok(src.includes('mq.removeEventListener("change", on)') && src.includes("cancelAnimationFrame(id)") && src.includes("return () => clearTimeout(t)"), "cleanup")
assert.ok(src.includes('role="toolbar"') && src.includes("aria-current={i === idx}") && src.includes("tabIndex={i === idx ? 0 : -1}"), "toolbar with a roving tab stop")
assert.ok(flat.includes(".tdk-item:focus-visible{"), "visible focus ring")

// ---- the lifted dock logic -----------------------------------------------------------
const start = src.indexOf("// #region dock")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "dock region markers missing")
const body = "const SIZE = 54, GAP = 10, PAD = 9\n" + src.slice(start, end)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(body)))
assert.equal(L.centreOf(0), 9 + 27)
assert.equal(L.centreOf(2), 9 + 2 * 64 + 27)
assert.equal(L.falloff(0), 1, "full size under the pointer")
assert.equal(L.falloff(65), 0.5, "half way out is half")
assert.equal(L.falloff(-65), 0.5, "symmetric")
assert.equal(L.falloff(130), 0, "nothing past reach")
assert.equal(L.falloff(500), 0)
assert.ok(L.falloff(20) > L.falloff(40), "falls off with distance")
assert.equal(L.keyStep("ArrowRight", 4, 5), 0, "wraps forward")
assert.equal(L.keyStep("ArrowLeft", 0, 5), 4, "wraps back")
assert.equal(L.keyStep("Home", 3, 5), 0)
assert.equal(L.keyStep("End", 1, 5), 4)
assert.equal(L.keyStep("a", 1, 5), -1)

console.log(slug + ": ok")
