// Install-safety and burst-logic checks for components/heart-burst-button.
// Run: node tests/heart-burst-button.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "heart-burst-button"
const prefix = ".hbb-"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort())
assert.doesNotMatch(src, /\bh-full\b/, "no h-full on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.match(src, /^export default function HeartBurstButton/m)
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
assert.match(demo, /from "@\/components\/ui\/heart-burst-button"/, "the demo imports the installer path")
assert.doesNotMatch(demo, /https?:\/\//, "the demo fetches nothing off-origin")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*(\/\/[^\n]*\n\s*)*"/g, "").replace(/\n\s*\/\/[^\n]*/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(\d+%(,\d+%)*|from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(prefix)), "unscoped selector: " + sel)
}
assert.ok(rules >= 20, "the scope check saw real rules, saw " + rules)
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
const allowed = new Set(["--hbb-red", "--hbb-red2", "--hbb-font", "--x", "--y", "--r", "--s", "--d", "--w", "--c"])
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- motion and runtime hygiene --------------------------------------------------
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)|setInterval/, "no layout reads, no timers")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS")
assert.ok(src.includes("!reduced.current ? burst("), "reduced motion skips the burst")
assert.ok(src.includes('mq.removeEventListener("change", on)') && src.includes("cancelAnimationFrame(id)"), "cleanup")
assert.ok(src.includes("aria-pressed={liked}"), "a real toggle button")
assert.ok(src.includes('key={"fx" + shot}'), "each like remounts the burst so it replays")
assert.ok(flat.includes(".hbb-btn:focus-visible{"), "visible focus ring")
assert.ok(flat.includes(".hbb-fx{position:absolute;left:24px"), "the burst sits outside the popping heart so it isn't scaled with it")

// ---- the lifted burst logic ---------------------------------------------------------
const start = src.indexOf("// #region burst")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "burst region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
for (let i = 0; i < 50; i++) {
  const r = L.rand(i)
  assert.ok(r >= 0 && r < 1, "rand in [0,1): " + r)
}
const a = L.burst(14, 13, ["#a", "#b"])
assert.equal(a.length, 14)
assert.deepEqual(a, L.burst(14, 13, ["#a", "#b"]), "deterministic per seed")
assert.notDeepEqual(a, L.burst(14, 26, ["#a", "#b"]), "a different click flies differently")
assert.equal(a.filter((p) => p.heart).length, 7, "half hearts")
assert.equal(a[0].c, "#a")
assert.equal(a[1].c, "#b")
for (const p of a) {
  const d = Math.hypot(p.x, p.y)
  assert.ok(d >= 30 && d <= 70, "flies a sensible distance: " + d)
  assert.ok(p.heart ? p.s >= 9 : p.s <= 6, "hearts are bigger than dots")
}
const angles = a.map((p) => Math.atan2(p.y, p.x))
assert.ok(angles.some((x) => x > 1) && angles.some((x) => x < -1) && angles.some((x) => Math.abs(x) < 0.8), "spread all round")
assert.equal(L.burst(3, 1, []).every((p) => p.c === "#ff2e63"), true, "an empty palette falls back")
assert.deepEqual(L.digits(1290), ["1", ",", "2", "9", "0"])
assert.deepEqual(L.digits(24), ["2", "4"])
assert.deepEqual(L.digits(-3), ["0"], "never negative")

console.log(slug + ": ok")
