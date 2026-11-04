// Install-safety and pose checks for components/folio-fold-menu.
// Run: node tests/folio-fold-menu.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/folio-fold-menu/", import.meta.url)
const src = readFileSync(new URL("folio-fold-menu.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap"], "imports are react and gsap only")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.gsap, "gsap is declared in the root package.json")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "folio-fold-menu.tsx"])

assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.ok(src.length < 80_000, "the component stays lean: " + src.length)
assert.doesNotMatch(src, /@@FONT|@@IMG/, "payload placeholders were filled")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "").replace(/url\((?:\\"|')?data:[^)]*\)/g, "url()")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel === "FONT +") continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".ffm-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 30, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.ffm-prev\{[^}]*max-width:none/, "previews override Preflight's max-width")
// container-type:inline-size stops the root sizing from its content; it needs its own width.
assert.match(flat, /\.ffm-root\{[^}]*width:100%[^}]*container-type:inline-size/, "the size-contained root carries its own width")

const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary", "--ffm-accent"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.replace(/xmlns='http:\/\/www\.w3\.org\/2000\/svg'/g, "").matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- motion and runtime hygiene --------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS transitions honour reduced motion")
assert.ok(src.includes("ctx.revert()"), "the GSAP context is reverted on unmount")
assert.ok(src.includes('window.removeEventListener("keydown", onKey)'), "the Escape listener is removed")
assert.ok(src.includes('e.key === "Escape"'), "Escape closes")
assert.ok(src.includes("aria-expanded={open}") && src.includes("aria-controls={id}"), "the toggle is wired to the menu")
assert.ok(src.includes('toggleAttribute("inert", !open)'), "closed links are out of the tab order")
assert.ok(src.includes("byKey.current = e.detail === 0"), "focus moves in only on a keyboard open")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.doesNotMatch(src, /onUpdate|requestAnimationFrame/, "no per-frame callbacks")

// ---- the lifted pose logic -------------------------------------------------------
const start = src.indexOf("// #region pose")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "pose region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.foldPose(false).rotationX > 0, true, "the folded page tilts back")
assert.equal(L.foldPose(false).scale < 1, true, "and shrinks")
assert.deepEqual([L.foldPose(true).rotationX, L.foldPose(true).scale], [0, 1], "reduced motion: no tilt, no scale")
assert.equal(L.foldPose(true).yPercent, L.foldPose(false).yPercent, "both land the page at the same height")
assert.equal(L.linkStagger(1), 0)
assert.equal(L.linkStagger(3), 0.07, "short lists use the full stagger")
assert.ok(Math.abs(L.linkStagger(13) * 12 - 0.36) < 1e-9, "long lists cap the total stagger")
assert.equal(L.pad2(0), "01")
assert.equal(L.pad2(9), "10")

console.log("folio-fold-menu: ok")
