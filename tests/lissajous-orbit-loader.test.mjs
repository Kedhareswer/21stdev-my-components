// Install-safety, frame-loop hygiene and curve-math checks for components/lissajous-orbit-loader.
// Run: node tests/lissajous-orbit-loader.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "lissajous-orbit-loader"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments")
assert.ok(src.length < 80_000, "lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "").replace(/url\([^)]*\)/g, "url()")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel.startsWith("FONT") || /^(from|to|\d+%)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".lol-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 12, "the scope check saw real rules, saw " + rules)
const allowed = new Set(["--color-foreground", "--color-muted-foreground"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(v.startsWith("--lol-") || allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")
assert.deepEqual([...demo.matchAll(/["'(]https?:\/\//g)], [], "demo is self-contained")

// ---- frame loop hygiene ----------------------------------------------------------
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads anywhere")
assert.ok(src.includes("new ResizeObserver") && src.includes("ro.disconnect()"), "size comes from a ResizeObserver")
assert.ok(src.includes("cancelAnimationFrame(raf)") && src.includes("visibilitychange"), "the loop stops when hidden and on unmount")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.ok(src.includes("if (reduced.matches) draw(0)"), "reduced motion draws one still frame")
assert.ok(src.includes("[size, hold, colorKey]"), "a new colours array literal doesn't restart the loop")
assert.ok(src.includes('role="progressbar"') && src.includes("aria-valuenow={known") && src.includes("aria-valuetext"), "progress semantics")

// ---- the lifted curve math ---------------------------------------------------------
const start = src.indexOf("// #region curves")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const close = (a, b, e = 1e-9) => Math.abs(a - b) < e
for (const f of L.FIGURES) {
  let max = 0
  for (let i = 0; i <= 400; i++) {
    const [x, y] = L.point(f, (i / 400) * Math.PI * 2)
    max = Math.max(max, Math.abs(x), Math.abs(y))
  }
  assert.ok(max <= 1 + 1e-9, f.kind + " stays inside the unit box: " + max)
  assert.ok(max > 0.6, f.kind + " fills the box: " + max)
  const [a0, b0] = L.point(f, 0)
  const [a1, b1] = L.point(f, Math.PI * 2)
  assert.ok(close(a0, a1, 1e-6) && close(b0, b1, 1e-6), f.kind + " closes over one loop, so trails never jump")
}
assert.equal(L.easeInOut(0), 0)
assert.equal(L.easeInOut(1), 1)
assert.equal(L.easeInOut(0.5), 0.5)
assert.deepEqual(L.morphAt(0, 2, 1, 5), { from: 0, to: 1, m: 0 })
assert.equal(L.morphAt(2.5, 2, 1, 5).m, 0.5, "halfway through the morph")
assert.deepEqual(L.morphAt(3, 2, 1, 5), { from: 1, to: 2, m: 0 }, "then holds the next figure")
assert.deepEqual([L.morphAt(14, 2, 1, 5).from, L.morphAt(14, 2, 1, 5).to], [4, 0], "wraps round")
const F = L.FIGURES
assert.deepEqual(L.blend(F[0], F[1], 0, 1.2), L.point(F[0], 1.2))
const p = L.blend(F[0], F[1], 1, 1.2)
const q = L.point(F[1], 1.2)
assert.ok(close(p[0], q[0]) && close(p[1], q[1]), "a full blend lands on the next figure")

console.log(slug + ": ok")
