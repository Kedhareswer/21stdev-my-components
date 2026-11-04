// Install-safety and spotlight-logic checks for components/aurora-ring-button.
// Run: node tests/aurora-ring-button.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "aurora-ring-button"
const prefix = ".arb-"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort())
assert.doesNotMatch(src, /\bh-full\b/, "no h-full on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.match(src, /^export default function AuroraRingButton/m)
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
assert.match(demo, /from "@\/components\/ui\/aurora-ring-button"/, "the demo imports the installer path")
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
assert.ok(rules >= 25, "the scope check saw real rules, saw " + rules)
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)\{\.arb-root,/, "reduced motion stops the ring")
const allowed = new Set(["--arb-a", "--arb-1", "--arb-2", "--arb-3", "--arb-4", "--arb-x", "--arb-y", "--arb-font"])
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- runtime hygiene ----------------------------------------------------------------
assert.ok(flat.includes("@property --arb-a{syntax:'<angle>';inherits:true"), "the ring angle is registered and inherited")
assert.ok(flat.includes(".arb-root{") && flat.includes("animation:arb-spin 3.6s linear infinite}"), "one constant-speed spin (changing duration on hover would jump)")
assert.doesNotMatch(flat, /\.arb-root:hover[^{]*\{animation-duration/, "no duration swap on hover")
const reads = [...src.matchAll(/getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/g)]
assert.equal(reads.length, 1, "exactly one layout read")
const measureAt = src.indexOf("const measure = () =>")
assert.ok(reads[0].index > measureAt && reads[0].index < measureAt + 200, "the read lives in measure()")
assert.ok(src.includes("onPointerEnter: measure"), "measured on enter, not per move")
const move = src.slice(src.indexOf("const onMove"), src.indexOf("const onLeave"))
assert.ok(move.includes("rect.current") && !/getBoundingClientRect/.test(move), "moves read only the cache")
assert.ok(src.includes("cancelAnimationFrame(id)"), "cleanup")
assert.ok(flat.includes(".arb-btn:focus-visible{"), "visible focus ring")
assert.ok(flat.includes(".arb-sp1{") && !/nth-of-type/.test(flat), "sparkles are placed by class, not by sibling position")

// ---- the lifted spotlight logic --------------------------------------------------------
const start = src.indexOf("// #region spot")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "spot region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
const r = { left: 100, top: 20, width: 200, height: 50 }
assert.deepEqual(L.spotAt(200, 45, r), { x: 50, y: 50 })
assert.deepEqual(L.spotAt(100, 20, r), { x: 0, y: 0 })
assert.deepEqual(L.spotAt(350, 100, r), { x: 100, y: 100 }, "clamped")
assert.deepEqual(L.spotAt(133, 30, r), { x: 16.5, y: 20 })
assert.deepEqual(L.spotAt(1, 1, { left: 0, top: 0, width: 0, height: 0 }), { x: 50, y: 50 }, "unmeasured centres")

console.log(slug + ": ok")
