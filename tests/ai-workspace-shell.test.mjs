// Install-safety and shell-logic checks for components/ai-workspace-shell.
// Run: node tests/ai-workspace-shell.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/ai-workspace-shell/", import.meta.url)
const src = readFileSync(new URL("ai-workspace-shell.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "ai-workspace-shell.tsx", "demo.tsx"])
assert.ok(src.includes('height = "100svh"'), "page height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")

const css = src.slice(src.indexOf("const CSS = ["), src.indexOf('].join("")'))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS")
assert.doesNotMatch(css, /font:[^;"]*inherit\b[^;"]*;font-family/, "no font shorthand with inherit")
const flat = css.replace(/",\s*\n\s*"/g, "").replace(/"\s*\+\s*SPRING\s*\+\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(\d+%(,\d+%)*|to|from)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".aws-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 70, "scope check saw real rules: " + rules)
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.match(v, /^--(aws-c|k|i)$/, "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")

assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
for (const gone of ["window.clearInterval(id)", 'document.removeEventListener("pointerdown", down)', 'document.removeEventListener("keydown", key)', "window.clearTimeout(id)"])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.doesNotMatch(src, /requestAnimationFrame|getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no frame loop, no layout reads")
assert.ok(src.includes('role="menu"') && src.includes('role="menuitemradio"') && src.includes('aria-haspopup="menu"') && src.includes('aria-live="polite"'), "menu and log semantics")
assert.ok(src.includes('e.key === "Enter" && !e.shiftKey'), "Enter sends, Shift+Enter adds a line")

const start = src.indexOf("// #region shell")
const end = src.indexOf("// #endregion", start)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.equal(L.moveIndex(-1, 1, 3), 0, "down from nothing lands on the first")
assert.equal(L.moveIndex(-1, -1, 3), 2, "up from nothing lands on the last")
assert.equal(L.moveIndex(2, 1, 3), 0, "wraps forward")
assert.equal(L.moveIndex(0, -1, 3), 2, "wraps back")
assert.equal(L.moveIndex(0, 1, 0), -1, "empty menu")
assert.deepEqual(L.chunks("a  b c"), ["a  ", "b ", "c"], "spacing survives streaming")
assert.deepEqual(L.chunks("   "), [])
assert.equal(L.greetFor(3), "Working late")
assert.equal(L.greetFor(9), "Good morning")
assert.equal(L.greetFor(14), "Good afternoon")
assert.equal(L.greetFor(21), "Good evening")
console.log("ai-workspace-shell ok")
