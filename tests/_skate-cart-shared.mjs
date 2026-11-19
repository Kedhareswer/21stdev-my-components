// Shared install-safety checks for deck-rack-add-to-cart and flipboard-checkout-counter.
// Not a test file itself (node --test only picks up *.test.mjs).
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync } from "node:fs"

const TOKENS = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])

export function checkSkate(slug, prefix) {
  const dir = new URL("../components/" + slug + "/", import.meta.url)
  const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
  const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
  const readme = readFileSync(new URL("README.md", dir), "utf8")

  const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(imports, ["react"], slug + ": react is the only import")
  assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), slug + ": folder holds only the publishable files")
  const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
  assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), slug + ": tsconfig paths line")
  assert.ok(demo.includes('from "@/components/ui/' + slug + '"'), slug + ": demo imports the installed path")
  assert.deepEqual([...demo.matchAll(/https?:\/\//g)].length, 0, slug + ": demo fetches nothing itself")

  assert.match(src, /height = "100svh"/, slug + ": height defaults to a definite length")
  assert.doesNotMatch(src, /\bh-full\b/, slug + ": no h-full")
  assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, slug + ": no generic hook type arguments (they hang the 21st CLI)")
  assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, slug + ": no layout reads")
  assert.ok(src.length < 60_000, slug + ": stays lean, " + src.length)

  const at = src.indexOf("const CSS =")
  const css = src.slice(at, src.indexOf("\n\n", at)).replace(/"\s*\+\s*\n\s*"/g, "").replace(/"\s*\+\s*[A-Z]\s*\+\s*"/g, "")
  assert.doesNotMatch(css, /`|\$\{|@import/, slug + ": no backticks, ${ or @import in the CSS string")
  let rules = 0
  for (const m of css.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
    const sel = m[1].trim()
    if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(from|to)$/.test(sel) || /^[\d%,\s]+$/.test(sel)) continue
    rules++
    assert.ok(sel.replace(/\([^)]*\)/g, "()").split(",").every((s) => s.trim().startsWith("." + prefix)), slug + ": unscoped selector: " + sel)
  }
  assert.ok(rules > 30, slug + ": the scope check saw real rules, saw " + rules)
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/, slug + ": CSS honours reduced motion")
  assert.match(src, /prefers-reduced-motion: reduce/, slug + ": reduced motion is read at runtime")
  assert.ok(css.includes("." + prefix + "-root img{max-width:none"), slug + ": images escape Preflight's max-width")
  for (const [, v] of src.matchAll(/var\((--color-[a-z-]+)/g)) assert.ok(TOKENS.has(v), slug + ": token not guaranteed in a host: " + v)
  assert.doesNotMatch(css, /:root|(^|[{}"])\s*(body|html|\*)\s*[{,]/, slug + ": no global resets")

  // pictures: every file the component asks for is in dev/public/<slug>/
  const base = "https://kedhar-components.pages.dev/" + slug + "/"
  assert.ok(src.includes('const IMG_BASE = "' + base + '"'), slug + ": images come from the deployed site")
  const files = [...src.matchAll(/IMG_BASE \+ "([^"]+)"/g)].map((m) => m[1])
  assert.ok(files.length >= 5, slug + ": names its pictures")
  for (const f of files) assert.ok(existsSync(new URL("../dev/public/" + slug + "/" + f, import.meta.url)), slug + ": missing dev/public/" + slug + "/" + f)
  const urls = [...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
  assert.deepEqual(urls, [base], slug + ": the only URL is the image base")

  // no identifiers from the reference reel
  for (const w of [/kerb/i, /ascenta/i, /\bnoir\b/i, /oxblood/i, /4500/]) assert.doesNotMatch(src + demo + readme, w, slug + ": reference identifier " + w)
  // media for the index card
  assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), slug + ": media thumb")
  return { src, demo, css }
}
