// Install-safety and tilt-logic checks for components/cube-roll-button.
// Run: node tests/cube-roll-button.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "cube-roll-button"
const prefix = ".crb-"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort())
assert.doesNotMatch(src, /\bh-full\b/, "no h-full on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.match(src, /^export default function CubeRollButton/m)
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
assert.match(demo, /from "@\/components\/ui\/cube-roll-button"/, "the demo imports the installer path")
assert.doesNotMatch(demo, /https?:\/\//, "the demo fetches nothing off-origin")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*(\/\/[^\n]*\n\s*)*"/g, "").replace(/\n\s*\/\/[^\n]*/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^\d+%$|^(from|to)$/.test(sel) || /^\d+%(,\d+%)*$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(prefix)), "unscoped selector: " + sel)
}
assert.ok(rules >= 20, "the scope check saw real rules, saw " + rules)
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
const allowed = new Set(["--crb-face", "--crb-face2", "--crb-ink", "--crb-back", "--crb-back2", "--crb-glint", "--crb-font", "--crb-h", "--crb-rx", "--crb-ry", "--crb-f", "--crb-b", "--i"])
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- motion and runtime hygiene --------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS")
assert.ok(src.includes('mq.removeEventListener("change", on)') && src.includes("cancelAnimationFrame(id)"), "cleanup")
// The only layout read is the once-per-hover measure; the move handler reads the cache.
const reads = [...src.matchAll(/getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/g)]
assert.equal(reads.length, 1, "exactly one layout read")
const measureAt = src.indexOf("const measure = () =>")
assert.ok(measureAt > -1 && reads[0].index > measureAt && reads[0].index < measureAt + 200, "the read lives in measure()")
assert.ok(src.includes("onPointerEnter: measure"), "measured on pointer enter, not per move")
const move = src.slice(src.indexOf("const onMove"), src.indexOf("const line ="))
assert.ok(move.includes("rect.current") && !/getBoundingClientRect/.test(move), "the move handler reads only the cache")
assert.ok(src.includes('e.pointerType !== "mouse"'), "touch never tilts")
assert.match(flat, /\.crb-btn:focus-visible \.crb-l/, "keyboard focus plays the roll")
assert.ok(src.includes('aria-label": ariaLabel ?? label') && src.includes('aria-hidden="true"'), "one accessible name, glyphs hidden")

// ---- the lifted tilt logic ---------------------------------------------------------
const start = src.indexOf("// #region tilt")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "tilt region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
const r = { left: 100, top: 50, width: 200, height: 40 }
assert.deepEqual(L.tiltFor(200, 70, r, 8), { rx: 0, ry: 0 }, "centre is flat")
assert.deepEqual(L.tiltFor(300, 90, r, 8), { rx: -8, ry: 8 }, "bottom-right corner")
assert.deepEqual(L.tiltFor(0, 0, r, 8), { rx: 8, ry: -8 }, "outside clamps")
assert.deepEqual(L.tiltFor(150, 70, r, 0), { rx: 0, ry: 0 }, "tilt 0 is off")
assert.deepEqual(L.tiltFor(150, 70, { left: 0, top: 0, width: 0, height: 0 }, 8), { rx: 0, ry: 0 }, "unmeasured is flat")

console.log(slug + ": ok")
