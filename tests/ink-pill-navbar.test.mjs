// Install-safety and ink-logic checks for components/ink-pill-navbar.
// Run: node tests/ink-pill-navbar.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/ink-pill-navbar/", import.meta.url)
const src = readFileSync(new URL("ink-pill-navbar.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap"], "imports are react and gsap only")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "ink-pill-navbar.tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /@@FONT|@@IMG/, "payload placeholders were filled")
assert.ok(src.length < 60_000, "the component stays lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel === "FONT +" || /^(from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".ipn-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 25, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.ipn-root\{[^}]*width:100%[^}]*container-type:inline-size/, "the size-contained root carries its own width")
assert.match(flat, /\.ipn-ink\{[^}]*pointer-events:none/, "the ink layer never steals the pointer")

const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary", "--ipn-accent", "--c"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- motion and runtime hygiene --------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)\{\.ipn-bar\{animation:none\}/, "CSS motion honours reduced motion")
assert.ok(src.includes("new ResizeObserver(measure)") && src.includes("document.fonts?.ready.then(measure)"), "boxes are measured on resize and after fonts")
assert.ok(src.includes("gsap.killTweensOf(edge.current)") && src.includes("ro.disconnect()"), "tweens and the observer are cleaned up")
// The onUpdate paint only writes a clip-path from cached numbers.
const paint = src.slice(src.indexOf("const paint = "), src.indexOf("const moveTo = "))
assert.match(paint, /style\.clipPath = clipFor\(/, "paint writes the clip only")
const handlers = src.slice(src.indexOf("const paint = "), src.indexOf("const list = "))
assert.doesNotMatch(handlers, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads in paint, the pointer handlers or the tweens")
assert.doesNotMatch(src, /getBoundingClientRect|getComputedStyle|requestAnimationFrame/, "no rect reads or hand-rolled frame loops")
assert.ok(src.includes('aria-current={current === i ? "page" : undefined}'), "the current page is announced")
assert.ok(src.includes('role={inked ? "presentation" : undefined}') && src.includes('className="ipn-ink" aria-hidden="true"'), "the inverted copy is hidden from assistive tech")

// ---- the lifted ink logic --------------------------------------------------------
const start = src.indexOf("// #region ink")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "ink region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.clipFor(10, 60, 200), "inset(0px 140.00px 0px 10.00px round 999px)")
assert.equal(L.clipFor(-5, 260, 200), "inset(0px 0.00px 0px 0.00px round 999px)", "overshoot never goes negative")
const a = { left: 0, width: 60 }
const b = { left: 200, width: 60 }
assert.ok(L.edgeTimes(a, b).right < L.edgeTimes(a, b).left, "heading right: the right edge leads")
assert.ok(L.edgeTimes(b, a).left < L.edgeTimes(b, a).right, "heading left: the left edge leads")
assert.equal(L.edgeTimes(null, a).left, L.edgeTimes(null, a).right, "arriving from outside grows evenly")
assert.match(L.edgeEase(0.72), /back\.inOut/, "the trailing edge holds back")
assert.match(L.edgeEase(0.36), /out/, "the leading edge darts")
assert.deepEqual(L.letters("Go on").map((x) => x.ch), ["G", "o", " ", "o", "n"], "spaces survive the split")

console.log("ink-pill-navbar: ok")
