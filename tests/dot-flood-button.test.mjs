// Install-safety and pull-logic checks for components/dot-flood-button.
// Run: node tests/dot-flood-button.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "dot-flood-button"
const prefix = ".dfb-"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort())
assert.doesNotMatch(src, /\bh-full\b/, "no h-full on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.match(src, /^export default function DotFloodButton/m)
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
assert.match(demo, /from "@\/components\/ui\/dot-flood-button"/, "the demo imports the installer path")
assert.doesNotMatch(demo, /https?:\/\//, "the demo fetches nothing off-origin")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*(\/\/[^\n]*\n\s*)*"/g, "").replace(/"\s*\+\s*[A-Z]+\s*\+\s*"/g, "none").replace(/\n\s*\/\/[^\n]*/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(\d+%(,\d+%)*|from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(prefix)), "unscoped selector: " + sel)
}
assert.ok(rules >= 20, "the scope check saw real rules, saw " + rules)
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
const allowed = new Set(["--dfb-paper", "--dfb-ink", "--dfb-acc", "--dfb-px", "--dfb-py", "--dfb-font", "--dfb-dot", "--dfb-dx", "--dfb-ar", "--i"])
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
// the only URL is the SVG namespace inside the inlined grain; nothing is fetched
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), ["http://www.w3.org/2000/svg"], "nothing is fetched")
assert.ok(src.includes('const GRAIN = "url(\\"data:image/svg+xml,'), "the grain is a data URI")

// ---- runtime hygiene ----------------------------------------------------------------
const reads = [...src.matchAll(/getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/g)]
assert.equal(reads.length, 1, "exactly one layout read")
const measureAt = src.indexOf("const measure = () =>")
assert.ok(reads[0].index > measureAt && reads[0].index < measureAt + 200, "the read lives in measure()")
assert.ok(src.includes("onPointerEnter: measure"), "measured on enter, not per move")
const move = src.slice(src.indexOf("const onMove"), src.indexOf("const inner"))
assert.ok(move.includes("rect.current") && !/getBoundingClientRect/.test(move), "moves read only the cache")
assert.ok(src.includes('e.pointerType !== "mouse"'), "touch never leans")
assert.ok(src.includes('mq.removeEventListener("change", on)') && src.includes("cancelAnimationFrame(id)"), "cleanup")
assert.ok(flat.includes(".dfb-arw{position:absolute;"), "the arrow is absolutely placed, so hover never resizes the button")
assert.doesNotMatch(flat, /\.dfb-btn:hover[^{]*\{[^}]*\b(width|padding|margin)\s*:/, "hover changes no box size")
assert.ok(flat.includes(".dfb-btn:focus-visible .dfb-flood"), "keyboard focus plays the flood")
assert.ok(flat.includes(".dfb-btn:focus-visible{"), "visible focus ring")

// ---- the lifted pull logic -----------------------------------------------------------
const start = src.indexOf("// #region pull")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "pull region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
const r = { left: 0, top: 0, width: 200, height: 40 }
assert.deepEqual(L.pullAt(100, 20, r, 6), { x: 0, y: 0 }, "centre is still")
assert.deepEqual(L.pullAt(200, 40, r, 6), { x: 6, y: 3 }, "corner: full x, half y")
assert.deepEqual(L.pullAt(-500, -500, r, 6), { x: -6, y: -3 }, "clamped")
assert.deepEqual(L.pullAt(150, 20, r, 6), { x: 3, y: 0 })
assert.deepEqual(L.pullAt(150, 20, r, 0), { x: 0, y: 0 }, "pull 0 is off")

console.log(slug + ": ok")
