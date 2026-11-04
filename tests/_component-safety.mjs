// Shared install-safety checks for single-file components with a scoped CSS string.
// Not a test file itself (node --test only picks up *.test.mjs); the tests import it.
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const TOKENS = ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"]

/**
 * @param {string} slug
 * @param {{ prefix: string, imports: string[], vars?: string[], minRules?: number, maxDemoBytes?: number, runtimeMotion?: boolean, inline?: boolean }} o
 */
export function checkComponent(slug, o) {
  const dir = new URL("../components/" + slug + "/", import.meta.url)
  const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
  const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

  const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(imports, o.imports, slug + ": imports")
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
  for (const i of imports) assert.ok(pkg.dependencies[i.split("/")[0]], slug + ": " + i + " is declared in the root package.json")
  assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), slug + ": folder holds only the publishable files")
  const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
  assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), slug + ": tsconfig paths line")

  // Inline pieces (an avatar group) size to their content; stage pieces take a definite height.
  if (!o.inline) assert.match(src, /height = "100svh"/, slug + ": height defaults to a definite length")
  assert.doesNotMatch(src, /\bh-full\b/, slug + ": no h-full")
  assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, slug + ": no generic hook type arguments (they hang the 21st CLI)")
  assert.ok(src.length < 60_000, slug + ": component stays lean, " + src.length)

  const cssAt = src.indexOf("const CSS =")
  assert.ok(cssAt > -1, slug + ": has a CSS string")
  const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
  assert.doesNotMatch(css, /`|\$\{|@import/, slug + ": no backticks, ${ or @import in the CSS string")
  const flat = css.replace(/"\s*\+\s*\n\s*"/g, "").replace(/"\s*\+\s*[A-Z_]+(\s*\+\s*"|\s*$)/g, "")
  let rules = 0
  for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
    const sel = m[1].trim()
    if (sel.startsWith("@") || sel.startsWith("const CSS") || /^[a-z]+\(/.test(sel) || /^\d/.test(sel) || sel === "from" || sel === "to") continue
    rules++
    assert.ok(sel.split(",").every((s) => s.trim().startsWith("." + o.prefix)), slug + ": unscoped selector: " + sel)
  }
  assert.ok(rules >= (o.minRules ?? 12), slug + ": the scope check saw real rules, saw " + rules)
  assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, slug + ": CSS honours reduced motion")
  if (/<img/.test(src)) assert.match(flat, /img\{[^}]*max-width:none/, slug + ": images override Preflight's max-width")

  const allowed = new Set([...TOKENS, ...(o.vars ?? [])])
  for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(allowed.has(v), slug + ": token not guaranteed in a host: " + v)
  const urls = [...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
  assert.deepEqual(urls, [], slug + ": the component fetches nothing itself")
  assert.deepEqual([...demo.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], slug + ": the demo is self-contained")
  assert.ok(Buffer.byteLength(demo) < (o.maxDemoBytes ?? 200_000), slug + ": demo under 21st's 200 kB limit")

  if (o.runtimeMotion !== false) assert.match(src, /prefers-reduced-motion: reduce/, slug + ": reduced motion is read at runtime")
  assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, slug + ": no layout reads")
  return { src, demo, css: flat }
}

/** Imports the code between `// #region <name>` and `// #endregion` as a module. */
export async function liftRegion(src, name) {
  const start = src.indexOf("// #region " + name)
  const end = src.indexOf("// #endregion", start)
  assert.ok(start > -1 && end > start, "region " + name + " markers missing")
  return import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
}
