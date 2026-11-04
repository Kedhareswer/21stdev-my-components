// Install-safety and pattern checks for components/pixel-wave-loader.
// Run: node tests/pixel-wave-loader.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/pixel-wave-loader/", import.meta.url)
const src = readFileSync(new URL("pixel-wave-loader.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react only")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "pixel-wave-loader.tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|LayoutEffect|Effect)</, "no generic hook type arguments")
assert.doesNotMatch(src, /requestAnimationFrame|setInterval|addEventListener/, "pure CSS: no JS per frame")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^[\d%,]+$/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".pwl-")), "unscoped selector: " + sel)
}
const allowed = new Set(["--pwl-cols", "--pwl-size", "--pwl-gap", "--pwl-d", "--pwl-from", "--pwl-to", "--ph", "--t", "--color-foreground"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.match(flat, /@keyframes pwl-wave\{[^}]*transform:scale\(\.38\);opacity:\.2\}/, "the wave animates transform and opacity only")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)\{\.pwl-p\{animation-name:pwl-glow\}/, "reduced motion keeps a still grid with a soft glow")
assert.ok(src.includes('role="status"') && src.includes('aria-label={label || "Loading"}'), "announced as a status")

const start = src.indexOf("// #region pattern")
const end = src.indexOf("// #endregion", start)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
for (const p of ["diagonal", "radial", "ripple", "snake"])
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) { const v = L.phase(p, x, y, 5, 5); assert.ok(v >= 0 && v <= 1, p + " in range: " + v) }
assert.equal(L.phase("diagonal", 0, 0, 4, 4), 0)
assert.equal(L.phase("diagonal", 3, 3, 4, 4), 1)
assert.equal(L.phase("radial", 2, 2, 5, 5), 0, "the centre leads")
assert.equal(L.phase("radial", 0, 0, 5, 5), 1, "corners trail")
assert.equal(L.phase("snake", 3, 1, 4, 4), L.phase("snake", 3, 0, 4, 4) + 1 / 15, "row two runs back from the right")
assert.equal(L.phase("diagonal", 0, 0, 1, 1), 0, "a single pixel works")
assert.equal(L.tint(0, 0, 4, 4), 0)
assert.equal(L.tint(3, 3, 4, 4), 100)

console.log("pixel-wave-loader: ok")
