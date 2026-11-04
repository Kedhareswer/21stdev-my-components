// Shared install-safety checks for the dropdown / accordion / picker batch.
// Not a test itself (node --test only runs *.test.mjs); each piece's test calls it.
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const TOKENS = ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"]

export function checkPiece(slug, prefix, { extraTokens = [], minRules = 15 } = {}) {
  const dir = new URL("../components/" + slug + "/", import.meta.url)
  const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
  const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

  assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), slug + ": folder holds only the component, demo and README")
  const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(imports, ["react"], slug + ": imports react only")
  assert.match(demo, /from "@\/components\/ui\/[a-z-]+"/, slug + ": demo imports the installer path")
  assert.match(demo, /export default function/, slug + ": demo has a default export")
  const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
  assert.ok(tsconfig.includes('"@/components/ui/' + slug + '"'), slug + ": tsconfig paths line")

  assert.doesNotMatch(src, /\bh-full\b/, slug + ": no h-full")
  assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Reducer)</, slug + ": no generic hook type arguments (they hang the 21st CLI)")
  assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, slug + ": no layout reads")
  assert.deepEqual([...src.matchAll(/https?:\/\/(?!www\.w3\.org)[^"'\s)]+/g)].map((m) => m[0]), [], slug + ": the component fetches nothing itself")
  assert.ok(src.length < 60_000, slug + ": lean component, " + src.length)

  const cssAt = src.indexOf("const CSS =")
  assert.ok(cssAt > -1, slug + ": has a CSS string")
  const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
  assert.doesNotMatch(css, /`|\$\{|@import/, slug + ": no backticks, ${ or @import in CSS")
  const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
  let rules = 0
  for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
    const sel = m[1].trim()
    if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(from|to|\d+%)/.test(sel)) continue
    rules++
    assert.ok(sel.split(",").every((s) => s.trim().startsWith("." + prefix + "-")), slug + ": unscoped selector: " + sel)
  }
  assert.ok(rules >= minRules, slug + ": scope check saw real rules, saw " + rules)
  assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, slug + ": CSS honours reduced motion")
  assert.match(flat, /@keyframes [a-z0-9-]+/, slug + ": has an entrance keyframe")

  const allowed = new Set([...TOKENS, ...extraTokens])
  for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(allowed.has(v) || v.startsWith("--" + prefix + "-"), slug + ": token not guaranteed in a host: " + v)
  return { src, demo, flat }
}

export async function lift(src, name = "logic") {
  const start = src.indexOf("// #region " + name)
  const end = src.indexOf("// #endregion", start)
  assert.ok(start > -1 && end > start, name + " region markers missing")
  return import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
}
