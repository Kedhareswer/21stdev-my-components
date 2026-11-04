// Install-safety and ripple-logic checks for components/ripple-roll-menu.
// Run: node tests/ripple-roll-menu.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/ripple-roll-menu/", import.meta.url)
const src = readFileSync(new URL("ripple-roll-menu.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "imports react only")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "ripple-roll-menu.tsx"])
assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /@@FONT|@@IMG/, "payload placeholders were filled")
assert.ok(src.length < 50_000, "the component stays lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*(EASE|OUT)\s*\+\s*"/g, " E ").replace(/"\s*\+\s*\n\s*"/g, "").replace(/url\(\\"data:[^)]*\)\\"\)/g, "url()")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel === "FONT +" || /^(from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".rrm-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 30, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.rrm-pic>img\{[^}]*max-width:none/, "photos override Preflight's max-width")
assert.match(flat, /\.rrm-pic\{[^}]*display:block/, "the photo pill is a box, not an inline span")
assert.match(flat, /\.rrm-root\{[^}]*width:100%[^}]*container-type:inline-size/, "the size-contained root carries its own width")
assert.doesNotMatch(flat, /\.rrm-rise\{[^}]*display:/, "the rise animation never overrides the row's flex layout")

const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary", "--rrm-accent", "--rrm-bg", "--rrm-ink", "--r"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.replace(/xmlns='http:\/\/www\.w3\.org\/2000\/svg'/g, "").matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- motion and runtime hygiene --------------------------------------------------
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)\{\.rrm-rise\{animation:none\}/, "reduced motion drops the rise and the rolls")
assert.ok(src.includes('closest("[data-i]")'), "the ripple origin comes from the letter under the pointer, not from geometry")
assert.ok(src.includes('aria-label={item.label}') && src.includes('className="rrm-word" aria-hidden="true"'), "each word is read once, not letter by letter")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.doesNotMatch(src, /requestAnimationFrame|setInterval/, "no frame loops")

// ---- the lifted logic ------------------------------------------------------------
const start = src.indexOf("// #region ripple")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "ripple region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.deepEqual([0, 1, 2, 3, 4].map((i) => L.rippleDelay(i, 2)), [48, 24, 0, 24, 48], "the ripple spreads both ways from the origin")
assert.equal(L.rippleDelay(5, 0, 10), 50)
assert.equal(L.originFrom("3", 7), 3)
assert.equal(L.originFrom(undefined, 7), 3, "no letter: start from the middle")
assert.equal(L.originFrom("9", 4), 2, "out of range: the middle")
assert.equal(L.originFrom("x", 4), 2)
assert.equal(L.pad2(0), "01")

console.log("ripple-roll-menu: ok")
