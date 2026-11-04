// Install-safety and flow-logic checks for components/checkout-flow-button.
// Run: node tests/checkout-flow-button.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "checkout-flow-button"
const prefix = ".cfb-"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort())
assert.doesNotMatch(src, /\bh-full\b/, "no h-full on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.match(src, /^export default function CheckoutFlowButton/m)
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
assert.match(demo, /from "@\/components\/ui\/checkout-flow-button"/, "the demo imports the installer path")
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
assert.ok(rules >= 30, "the scope check saw real rules, saw " + rules)
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
const allowed = new Set(["--cfb-ok", "--cfb-bad", "--cfb-font", "--cfb-w", "--cfb-busy", "--a", "--b", "--n"])
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- runtime hygiene and a11y --------------------------------------------------------
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)|setInterval/, "no layout reads, no polling")
assert.ok(flat.includes(".cfb-pill{position:relative;height:56px;width:var(--cfb-w);max-width:100%"), "width is a fixed per-step length, capped by the parent")
assert.ok(src.includes("timers.current.forEach(clearTimeout)") && src.includes("cancelAnimationFrame(id)") && src.includes("alive.current = false"), "timers cleared on unmount")
assert.ok(src.includes('role="group"') && src.includes('aria-live="polite"'), "grouped, and each step is announced")
assert.ok(flat.includes(".cfb-row{position:absolute") && flat.includes("visibility:hidden"), "inactive rows leave the tab order")
assert.ok(src.includes('tabIndex={tab("choose")}'), "inactive buttons are not tabbable")
assert.ok(src.includes("el.focus({ preventScroll: true })"), "focus follows the step")
assert.doesNotMatch(src, /<button[^>]*>\s*<button/, "no nested buttons")

// ---- the lifted flow logic -----------------------------------------------------------
const start = src.indexOf("// #region flow")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "flow region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
const path = ["open", "pick", "pay", "resolve", "reset"].reduce((acc, ev) => [...acc, L.step(acc.at(-1), ev)], ["idle"])
assert.deepEqual(path, ["idle", "choose", "confirm", "busy", "done", "idle"], "the happy path")
assert.equal(L.step("busy", "reject"), "error")
assert.equal(L.step("error", "retry"), "confirm", "a decline goes back to confirm")
assert.equal(L.step("confirm", "back"), "choose")
assert.equal(L.step("choose", "back"), "idle")
assert.equal(L.step("busy", "back"), "busy", "no backing out mid-charge")
assert.equal(L.step("idle", "pay"), "idle", "can't pay without choosing")
assert.equal(L.step("done", "open"), "done")
assert.equal(L.step("busy", "reset"), "busy")
for (const s of ["idle", "choose", "confirm", "busy", "done", "error"]) assert.ok(L.WIDTHS[s] >= 200 && L.WIDTHS[s] <= 380, "width for " + s)
assert.ok(L.WIDTHS.choose > L.WIDTHS.confirm && L.WIDTHS.confirm > L.WIDTHS.idle, "the pill grows to choose and settles to confirm")
assert.equal(L.holdFor(0, 500, 1900), 1400)
assert.equal(L.holdFor(0, 3000, 1900), 0)

console.log(slug + ": ok")
