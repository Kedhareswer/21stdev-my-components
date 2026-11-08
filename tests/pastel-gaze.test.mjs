// Install-safety checks for components/pastel-gaze.
// Run: node tests/pastel-gaze.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"

const dir = new URL("../components/pastel-gaze/", import.meta.url)
const file = new URL("pastel-gaze.tsx", dir)
const src = readFileSync(file, "utf8")
// the art is embedded; strip it so the checks below read only the code
const code = src.replace(/\r\n/g, "\n").replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g, "DATA")

const imports = [...code.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "pastel-gaze.tsx"])
assert.ok(statSync(file).size < 200_000, "fits 21st's 200 KB file limit: " + statSync(file).size)

assert.doesNotMatch(code, /\bh-full\b/, "no h-full on the root")
assert.doesNotMatch(code, /use(Ref|State|Memo|Callback)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(code, /<style>\{`/, "CSS is a plain string, not a template literal")
assert.match(code, /prefers-reduced-motion/, "honours reduced motion")
assert.match(code, /max-width:none/, "the artwork overrides Preflight's max-width")

// the pointer handler reads a cached box, measured at most once per enter
const move = code.slice(code.indexOf("function move("), code.indexOf("function activate("))
assert.match(move, /hitBox\.current \?\?/, "move() reuses the cached box")

const cssAt = code.indexOf("const CSS =")
const css = code.slice(cssAt, code.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
for (const m of css.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".pg-")), "unscoped selector: " + sel)
}
console.log("pastel-gaze: ok")
