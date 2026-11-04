// Install-safety and word-logic checks for components/sticker-swap-headline.
// Run: node tests/sticker-swap-headline.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/sticker-swap-headline/", import.meta.url)
const src = readFileSync(new URL("sticker-swap-headline.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap"], "imports are react and gsap only")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "sticker-swap-headline.tsx"])
assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|LayoutEffect|Effect)</, "no generic hook type arguments")
assert.ok(src.length < 60_000, "lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel === "FONT +" || /^(to|\d+%)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".ssh-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 25, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.ssh-disc>img\{[^}]*max-width:none/, "sticker photos override Preflight's max-width")
assert.match(flat, /\.ssh-inner\{[^}]*width:100%[^}]*container-type:inline-size/, "the size-contained box carries its own width")
const allowed = new Set(["--ssh-paper", "--ssh-ink", "--ssh-accent", "--ssh-font"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org")), [], "fetches nothing")
assert.doesNotMatch(demo, /src=["']https?:|url\(https?:/, "demo is self-contained")
assert.ok(demo.includes("data:image/webp;base64,"), "demo stickers are inlined")

// ---- motion and runtime hygiene --------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.ok(src.includes("if (reduced.current)"), "reduced motion takes a fade path")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS animations honour reduced motion")
assert.ok(src.includes("document.hidden") && src.includes("IntersectionObserver"), "autoplay pauses off-screen and in hidden tabs")
for (const gone of ['mq.removeEventListener("change", on)', "io.disconnect()", "window.clearInterval(id)", "ctx.revert()"])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.ok(src.includes('aria-live="polite"'), "the changing word is announced")

// ---- the lifted word logic ---------------------------------------------------------
const start = src.indexOf("// #region words")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.equal(L.stickerSlot("Curious"), 4)
assert.equal(L.stickerSlot("loud"), 1)
assert.equal(L.stickerSlot("Wild"), -1, "no O appends the sticker")
assert.equal(L.wrap(3, 3), 0)
assert.equal(L.wrap(-1, 3), 2)
assert.equal(L.wrap(2, 0), 0, "empty list")
assert.equal(L.pad2(3), "03")
assert.equal(L.tiltFor(0), -8)
assert.equal(L.tiltFor(1), 6)
assert.equal(L.tiltFor(1, 0), 0, "an explicit 0 tilt wins")

console.log("sticker-swap-headline: ok")
