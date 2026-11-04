// Install-safety and deck-logic checks for components/orbit-social-bento.
// Run: node tests/orbit-social-bento.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/orbit-social-bento/", import.meta.url)
const src = readFileSync(new URL("orbit-social-bento.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "orbit-social-bento.tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")

const css = src.slice(src.indexOf("const CSS = ["), src.indexOf('].join("")'))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS")
const flat = css.replace(/",\s*\n\s*"/g, "").replace(/"\s*\+\s*SPRING\s*\+\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(\d+%(,\d+%)*|to|from)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".osb-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 50, "scope check saw real rules: " + rules)
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.match(v, /^--(i|t|dir|rdir|r|a|s|c|k)$/, "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/(?!www\.w3\.org)[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")
assert.match(flat, /@keyframes osb-spin\{from\{transform:translate\(-50%,-50%\) rotate\(0deg\)\}/, "ring spin has a matching from frame, or 360deg interpolates to nothing")
assert.match(flat, /@keyframes osb-counter\{/, "avatars counter-rotate with their own keyframe")
assert.match(flat, /\.osb-note>\*\{opacity:calc/, "back cards fade their contents, not themselves, so cards never show through")

assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
for (const gone of ["cancelAnimationFrame(raf)", "window.clearInterval(deal)", "window.clearInterval(react)", "window.clearInterval(loop)", "window.clearTimeout(typer)", "io.disconnect()"])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")

const start = src.indexOf("// #region deck")
const end = src.indexOf("// #endregion", start)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.equal(L.rank(0, 0, 5), 0)
assert.equal(L.rank(4, 1, 5), 0, "the last card deals to the front")
assert.equal(L.rank(0, 1, 5), 1, "the old front steps back")
assert.equal(L.rank(2, -3, 5), 4, "negative offsets wrap")
assert.equal(L.rank(3, 2, 0), 0, "empty deck")
assert.equal(L.hueOf("AK", 7), L.hueOf("AK", 7), "a name keeps its colour")
assert.ok(L.hueOf("ZZ", 7) >= 0 && L.hueOf("ZZ", 7) < 7)
assert.equal(L.hueOf("x", 0), 0)
assert.equal(L.compact(48210.4), "48,210")
console.log("orbit-social-bento ok")
