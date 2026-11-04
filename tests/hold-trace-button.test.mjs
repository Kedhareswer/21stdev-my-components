// Install-safety and hold-logic checks for components/hold-trace-button.
// Run: node tests/hold-trace-button.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "hold-trace-button"
const prefix = ".htb-"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort())
assert.doesNotMatch(src, /\bh-full\b/, "no h-full on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.match(src, /^export default function HoldTraceButton/m)
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
assert.match(demo, /from "@\/components\/ui\/hold-trace-button"/, "the demo imports the installer path")
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
const allowed = new Set(["--htb-p", "--htb-c", "--htb-font", "--htb-ms", "--htb-rew"])
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- motion and runtime hygiene --------------------------------------------------
assert.ok(flat.includes("@property --htb-p{syntax:'<number>'"), "progress is one registered CSS number")
assert.ok(flat.includes(".htb-root[data-hold]{--htb-p:1;transition:--htb-p var(--htb-ms) linear}"), "holding transitions it linearly over holdMs")
for (const use of ["stroke-dashoffset:calc(100 - var(--htb-p)*100)", "clip-path:inset(0 calc((1 - var(--htb-p))*100%) 0 0 round 999px)"]) assert.ok(flat.includes(use), "reads the progress: " + use)
assert.ok(src.includes("pathLength={100}"), "the trace needs no path measuring")
assert.ok(src.includes("new ResizeObserver") && src.includes("ro.disconnect()"), "the rect is sized from a ResizeObserver")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)|requestAnimationFrame\(loop/, "no layout reads, no per-frame loop")
for (const c of ["clearTimeout(timer.current)", "clearInterval(ticker.current)", "clearTimeout(undoTimer.current)", "cancelAnimationFrame(id)"]) assert.ok(src.includes(c), "cleanup: " + c)
for (const ev of ["onPointerUp={cancel}", "onPointerCancel={cancel}", "onLostPointerCapture={cancel}", "onBlur={cancel}"]) assert.ok(src.includes(ev), "release paths cancel: " + ev)
assert.ok(src.includes("if (!e.repeat) start()"), "key auto-repeat does not restart the hold")
assert.ok(src.includes('aria-live="polite"'), "the result is announced")
assert.ok(flat.includes(".htb-btn:focus-visible{"), "visible focus ring")

// ---- the lifted hold logic -----------------------------------------------------------
const start = src.indexOf("// #region hold")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "hold region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.equal(L.isHoldKey(" "), true)
assert.equal(L.isHoldKey("Enter"), true)
assert.equal(L.isHoldKey("Escape"), false)
assert.equal(L.rewindMs(0, 1000), 160, "a tap snaps back fast")
assert.equal(L.rewindMs(1000, 1000), 420)
assert.equal(L.rewindMs(5000, 1000), 420, "clamped")
assert.equal(L.rewindMs(500, 1000), 290)
assert.equal(L.secondsLeft(0, 1100), "1.1")
assert.equal(L.secondsLeft(600, 1100), "0.5")
assert.equal(L.secondsLeft(2000, 1100), "0.0", "never negative")

console.log(slug + ": ok")
