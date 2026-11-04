// Install-safety and state-machine checks for components/comet-orbit-button.
// Run: node tests/comet-orbit-button.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "comet-orbit-button"
const prefix = ".cob-"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort())
assert.doesNotMatch(src, /\bh-full\b/, "no h-full on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.match(src, /^export default function CometOrbitButton/m)
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
assert.match(demo, /from "@\/components\/ui\/comet-orbit-button"/, "the demo imports the installer path")
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
const allowed = new Set(["--cob-a", "--cob-accent", "--cob-ok", "--cob-bad", "--cob-c", "--cob-font"])
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- motion and runtime hygiene --------------------------------------------------
assert.ok(flat.includes("@property --cob-a{syntax:'<angle>'"), "the orbit is a registered angle, animated by CSS")
assert.doesNotMatch(src, /setInterval|requestAnimationFrame\(loop/, "no per-frame JS")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.ok(src.includes("timers.current.forEach(clearTimeout)") && src.includes("cancelAnimationFrame(id)") && src.includes("alive.current = false"), "timers cleared on unmount")
assert.ok(src.includes('aria-disabled={state !== "idle"}') && src.includes('aria-live="polite"'), "busy is disabled and states are announced")
assert.ok(flat.includes(".cob-btn:focus-visible{"), "visible focus ring")
for (const s of ["idle", "busy", "done", "error"]) assert.ok(src.includes('row("' + s + '"'), "a label row for " + s)

// ---- the lifted state logic ----------------------------------------------------------
const start = src.indexOf("// #region states")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "states region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.equal(L.next("idle", "click"), "busy")
assert.equal(L.next("busy", "click"), "busy", "double clicks do nothing")
assert.equal(L.next("done", "click"), "done")
assert.equal(L.next("busy", "resolve"), "done")
assert.equal(L.next("busy", "reject"), "error")
assert.equal(L.next("idle", "resolve"), "idle", "a stray settle after reset is ignored")
assert.equal(L.next("done", "reset"), "idle")
assert.equal(L.next("error", "reset"), "idle")
assert.equal(L.next("busy", "reset"), "busy", "reset never cuts the orbit short")
assert.equal(L.holdFor(1000, 1300, 1800), 1500, "an instant action still orbits the minimum")
assert.equal(L.holdFor(1000, 4000, 1800), 0, "a slow action settles immediately")

console.log(slug + ": ok")
