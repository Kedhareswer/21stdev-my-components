// Install-safety and logic checks for components/ink-orbit-footer.
// Run: node tests/ink-orbit-footer.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "ink-orbit-footer"
const read = (f) => readFileSync(new URL(`../components/${SLUG}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|new Image\(|<img\b|https?:\/\//, "nothing loads at runtime")
assert.doesNotMatch(src, /\bh-full\b|height:\s*"?100%/, "no percentage heights")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks typed without <generics> (21st CLI tokenizer)")
assert.doesNotMatch(src, /location\.|history\./, "the host's URL is untouched")
{
  const css = src.match(/const IF_CSS = `([\s\S]*?)`/)[1]
  assert.doesNotMatch(css, /\$\{|(^|[\s}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /repeating-linear-gradient\(135deg/, "the hatched page background travels with it")
  assert.match(css, /\.if-root\{[^}]*width:100%/, "the root claims full width inside a flex wrapper")
  assert.match(css, /prefers-reduced-motion:reduce\)\{[\s\S]*\.if-live\{animation:none\}/, "reduced motion stops the live ping")
  assert.match(css, /\.if-status\{display:inline-flex/, "the live dot sits in a flex row, or the <i> collapses to 0px")
}
assert.match(src, /noValidate/, "the form validates itself, so the message is ours, not the browser's")
for (const d of ["demo.tsx", "demo-custom.tsx"]) {
  const demo = read(d)
  assert.match(demo, /from "@\/components\/ui\/ink-orbit-footer"/, `${d} imports the installed path`)
  assert.doesNotMatch(demo, /https?:\/\//, `${d} is self-contained`)
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b)) + "\nexport { isEmail, parseTitle }")
)

for (const ok of ["a@b.co", " you@company.com ", "x.y+z@sub.domain.io"]) assert.ok(L.isEmail(ok), ok)
for (const bad of ["", "a@b", "a@b.c", "a b@c.io", "@c.io", "a@.io"]) assert.ok(!L.isEmail(bad), JSON.stringify(bad))

assert.deepEqual(L.parseTitle("Ready to build *faster?*")[0][1], { text: "faster?", muted: true })

console.log(`${SLUG}: ok`)
