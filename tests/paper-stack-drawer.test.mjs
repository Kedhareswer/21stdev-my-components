// Install-safety and stack-logic checks for components/paper-stack-drawer.
// Run: node tests/paper-stack-drawer.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/paper-stack-drawer/", import.meta.url)
const src = readFileSync(new URL("paper-stack-drawer.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap"], "imports are react and gsap only")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "paper-stack-drawer.tsx"])
assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /@@FONT|@@IMG/, "payload placeholders were filled")
assert.ok(src.length < 70_000, "the component stays lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*EASE\s*\+\s*"/g, " E ").replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel === "FONT +") continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".psd-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 40, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.psd-thumb>img\{[^}]*max-width:none/, "the card photo overrides Preflight's max-width")
assert.match(flat, /\.psd-root\{[^}]*width:100%[^}]*container-type:inline-size/, "the size-contained root carries its own width")

const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary", "--psd-accent", "--psd-w", "--psd-shade", "--i"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- motion and runtime hygiene --------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS transitions honour reduced motion")
assert.ok(src.includes('mq.removeEventListener("change", on)'), "the media listener is removed")
assert.ok(src.includes('window.removeEventListener("keydown", onKey)'), "the Escape listener is removed")
assert.ok(src.includes("if (stack.length) pop()"), "Escape lifts a sheet before it closes the drawer")
assert.ok(src.includes('el.style.transition = "none"'), "GSAP owns the transform while a sheet slides")
assert.ok(src.includes('toggleAttribute("inert", !open)'), "a closed drawer is out of the tab order")
assert.ok(src.includes('aria-haspopup="true"'), "rows that open a sheet say so")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.doesNotMatch(src, /onUpdate|requestAnimationFrame/, "no per-frame callbacks")

// ---- the lifted stack logic ------------------------------------------------------
const start = src.indexOf("// #region stack")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "stack region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const tree = [{ label: "A" }, { label: "Gear", children: [{ label: "Shells", title: "Shells & co", children: [{ label: "Hard" }] }] }]
assert.equal(L.itemAt(tree, [1]).label, "Gear")
assert.equal(L.itemAt(tree, [1, 0, 0]).label, "Hard")
assert.equal(L.itemAt(tree, [3]), undefined, "off the tree")
assert.equal(L.itemAt(tree, [0, 0]), undefined, "a leaf has no children")
assert.deepEqual(L.trail(tree, [1, 0], "Menu"), ["Menu", "Gear", "Shells & co"], "titles win over labels")
assert.deepEqual(L.sheetPose(0), { x: -0, scale: 1, shade: 0 }, "the top sheet sits flat")
assert.ok(L.sheetPose(1).x < 0 && L.sheetPose(1).scale < 1, "sheets beneath step left and back")
assert.deepEqual(L.sheetPose(9), L.sheetPose(3), "deep stacks stop stepping")
assert.ok(L.sheetPose(3).shade <= 0.4)

console.log("paper-stack-drawer: ok")
