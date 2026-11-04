// Install-safety and composer-logic checks for components/halo-ai-composer.
// Run: node tests/halo-ai-composer.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "halo-ai-composer"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments")
assert.ok(src.length < 90_000, "lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "").replace(/url\([^)]*\)/g, "url()")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel.startsWith("FONT") || /^(from|to|\d+%)/.test(sel)) continue
  rules++
  // :where(.dark) adds no specificity and only follows the host's theme class.
  assert.ok(sel.split(",").every((s) => s.trim().replace(/^:where\(\.dark\)\s+/, "").startsWith(".hac-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 60, "the scope check saw real rules, saw " + rules)
assert.match(flat, /:where\(\.dark\) \.hac-root\{/, "follows the host's dark class")
assert.match(flat, /\.hac-att-ic>img\{[^}]*max-width:none/, "previews override Preflight")
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(v.startsWith("--hac-"), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")
assert.deepEqual([...demo.matchAll(/["'(]https?:\/\//g)], [], "demo is self-contained")

// ---- a11y and motion ---------------------------------------------------------------
assert.ok(src.includes('role="combobox"') && src.includes("aria-activedescendant") && src.includes('role="listbox"'), "slash menu is a combobox")
assert.ok(src.includes('aria-label="Message"'), "the field is labelled")
assert.ok(src.includes("!e.shiftKey && !e.nativeEvent.isComposing"), "Enter sends, Shift+Enter and IME don't")
assert.ok(src.includes('aria-label={busy ? "Stop generating" : "Send message"}'), "send/stop is labelled")
assert.ok(src.includes('aria-live="polite"'), "status is announced")
assert.match(flat, /\.hac-grow::after\{content:attr\(data-value\)/, "auto-grow by CSS mirror, no measuring")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "reduced motion honoured")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.ok(src.includes("URL.revokeObjectURL") && src.includes("recog.current?.stop()"), "previews and dictation are released")

// ---- the lifted logic ------------------------------------------------------------
const start = src.indexOf("// #region composer-logic")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.slashQuery("/"), "")
assert.equal(L.slashQuery("/Sum"), "sum")
assert.equal(L.slashQuery("hello /sum"), null, "only at the start")
assert.equal(L.slashQuery("/sum\nmore"), null, "not once the line breaks")
const cmds = [{ id: "summarize", label: "Summarize" }, { id: "explain", label: "Explain code" }]
assert.equal(L.filterCommands(cmds, "").length, 2)
assert.deepEqual(L.filterCommands(cmds, "code").map((c) => c.id), ["explain"])
assert.deepEqual(L.filterCommands(cmds, "zzz"), [])
assert.equal(L.countTone(10, 100), "ok")
assert.equal(L.countTone(80, 100), "warn")
assert.equal(L.countTone(101, 100), "bad")
assert.equal(L.canSend("  ", 0, 100, false), false, "blank can't send")
assert.equal(L.canSend("", 1, 100, false), true, "a file alone can")
assert.equal(L.canSend("hi", 0, 100, true), false, "not while busy")
assert.equal(L.canSend("x".repeat(101), 0, 100, false), false, "not over the limit")
assert.equal(L.formatClock(65), "1:05")
assert.equal(L.formatClock(-3), "0:00")

console.log(slug + ": ok")
