// Install-safety and direction checks for components/compass-mega-header.
// Run: node tests/compass-mega-header.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/compass-mega-header/", import.meta.url)
const src = readFileSync(new URL("compass-mega-header.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "imports react only")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "compass-mega-header.tsx", "demo.tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /@@FONT|@@IMG/, "payload placeholders were filled")
assert.ok(src.length < 60_000, "the component stays lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*EASE\s*\+\s*"/g, " E ").replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel === "FONT +" || /^(from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".cmh-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 40, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.cmh-feat>img\{[^}]*max-width:none/, "feature photos override Preflight's max-width")
assert.match(flat, /\.cmh-root\{[^}]*width:100%[^}]*container-type:inline-size/, "the size-contained root carries its own width")
assert.doesNotMatch(flat, /font:[^;}]*inherit/, "no inherit inside the font shorthand (it drops the whole declaration)")

const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary", "--cmh-accent", "--cmh-max", "--cmh-x", "--cols"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- motion and runtime hygiene --------------------------------------------------
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)\{\.cmh-bar\{animation:none\}/, "reduced motion drops the entrance and the slides")
assert.ok(src.includes("new ResizeObserver") && src.includes("ro.disconnect()"), "sizes come from a ResizeObserver")
assert.ok(src.includes("document.fonts?.ready.then(measure)"), "item positions are re-measured once fonts load")
assert.ok(src.includes('document.removeEventListener("pointerdown", onDown)') && src.includes('window.removeEventListener("keydown", onKey)'), "listeners are removed")
assert.ok(src.includes("window.clearTimeout(timer.current)"), "intent timers are cleared")
assert.ok(src.includes('e.pointerType === "mouse" && show(i)'), "hover opens only for a mouse; touch uses the click")
assert.ok(src.includes('toggleAttribute("inert", i !== active)'), "hidden menus are out of the tab order")
assert.ok(src.includes('e.key === "ArrowDown"'), "ArrowDown opens a menu from the keyboard")

// Layout reads live only inside measure(), which runs on mount, on resize and after fonts.
const handlers = src.slice(src.indexOf("const show = "), src.indexOf("return (\n    <div"))
assert.doesNotMatch(handlers, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|getComputedStyle|inner(Width|Height)/, "no layout reads in the pointer or key handlers")
assert.doesNotMatch(src, /getBoundingClientRect|getComputedStyle|requestAnimationFrame/, "no rect reads or frame loops at all")

// ---- the lifted logic ------------------------------------------------------------
const start = src.indexOf("// #region compass")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "compass region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.sideOf(1, 1), "on")
assert.equal(L.sideOf(0, 2), "before", "moving right: the old menu leaves to the left")
assert.equal(L.sideOf(3, 2), "after", "moving left: the old menu leaves to the right")
assert.equal(L.centreOf({ left: 100, width: 60 }), 130)
assert.equal(L.centreOf(undefined), 0)
assert.equal(L.openDelay(true), 0, "no delay once open")
assert.ok(L.openDelay(false) > 0, "a short intent pause from closed")

console.log("compass-mega-header: ok")
