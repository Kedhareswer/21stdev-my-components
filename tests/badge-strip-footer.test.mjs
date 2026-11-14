// Runnable check for components/badge-strip-footer: the badge tilts, the marquee, the picture
// URLs and the install-safety rules.
// Run: node tests/badge-strip-footer.test.mjs
//
// What breaks silently here: a strip whose second copy doesn't match the first (the loop jumps),
// a custom badge URL that breaks out of url(), or a marquee that keeps running under reduced motion.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "badge-strip-footer"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 200_000, "under 21st's 200 kB component limit: " + statSync(file).size)
assert.ok(Buffer.byteLength(demo) < 200_000, "demo under 21st's 200 kB limit")
assert.match(demo, /from "@\/components\/ui\/badge-strip-footer"/, "demo imports the installed path")

const imgKeys = [...src.matchAll(/^  ([a-z]\d): IMG_BASE \+ "\1\.webp",?$/gm)].map((m) => m[1])
const want = ["a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8"]
assert.deepEqual(imgKeys, want, "the eighteen badge drawings, no stickers")
const fonts = [...src.matchAll(/@font-face\{font-family:(Bkm(?:Sans|Mono));font-weight:([\d ]+);/g)].map((m) => m[1] + " " + m[2])
assert.deepEqual(fonts, ["BkmSans 400", "BkmMono 400 700"], "only the faces the legal row uses")

assert.match(src, /height = "420px"/, "height defaults to a definite length")
assert.match(src, /minHeight: height/, "and is applied as a minimum")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /var\(--color-/, "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, ["https://kedhar-components.pages.dev/bunkum/"], "the only URL is the drawings' base; fonts stay embedded")

assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /behavior: s\.current\.still \? "auto" : "smooth"/, "back to top jumps instead of gliding under reduced motion")
assert.match(src, /\(hover: hover\) and \(pointer: fine\)/, "fine-pointer gate is read at runtime")
assert.match(src, /ev\.pointerType !== "mouse"\) return/, "touch never drives the context label")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|getComputedStyle/, "no layout reads")
assert.match(src, /\{\[0, 1\]\.map\(\(n\) =>/, "the row is rendered twice for a seamless loop")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*(\/\*[^*]*\*\/\s*\n\s*)?"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\.bkm-root \*\{animation:none!important/, "CSS stops the marquee under reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{\.bkm-cursor\{display:block\}\}/, "the context label only exists where a mouse can hover")
assert.match(css, /\.bkm-cursor\{display:none/, "and is hidden everywhere else")
assert.match(css, /\.bkm-root svg,\.bkm-root img\{max-width:none\}/, "guards Preflight's img/svg max-width")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((x) => /^(\.dark )?\.bkm-/.test(x.trim())), "unscoped selector: " + sel)
}
assert.ok(rules >= 15, "the scope check saw real rules, saw " + rules)

for (const v of [
  ".bkm-strip{display:flex;gap:14px;margin:0 -18px;overflow:hidden;padding:8px 0}",
  ".bkm-strip>div{display:flex;gap:14px;flex:none;animation:bkm-marq 46s linear infinite}",
  ".bkm-strip i{flex:none;width:clamp(84px,9vw,128px);aspect-ratio:1;border-radius:50%;border:2px solid var(--ink)",
  "@keyframes bkm-marq{to{transform:translateX(calc(-100% - 14px))}}",
  ".bkm-legal{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-top:clamp(40px,7vh,72px)}",
  ".bkm-sig{width:clamp(90px,10vw,130px);height:auto;color:var(--butter)}",
  "background-size:37px 41px,53px 47px,113px 97px",
  "--blue:#2731e8;--deep:#0d137a;--butter:#ffe98a;--ink:#0c0c10;--paper:#f6f1e3",
]) assert.ok(css.includes(v), "kept from the template: " + v)

// ---- the strip ------------------------------------------------------------
const S = await liftRegion(src, "strip")
assert.deepEqual([0, 1, 2, 3, 4, 5, 17].map(S.tilt), [-8, -4, 0, 4, 8, -8, 0], "the template's lean, repeating every five")
assert.equal(S.tilt(-1), 8, "never out of the cycle")
assert.equal(S.MARQUEE_S, 46)
assert.ok(css.includes("bkm-marq " + S.MARQUEE_S + "s linear"), "the constant matches the CSS")
assert.equal(S.urlOf("/a.webp"), 'url("/a.webp")')
assert.equal(S.urlOf('x");background:red;("'), 'url("x);background:red;(")', "quotes can't break out of url()")

console.log("badge-strip-footer: ok")
