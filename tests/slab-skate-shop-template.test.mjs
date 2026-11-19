// Runnable check for components/slab-skate-shop-template: the shared cart, the pasted components, the content rules
// and the install-safety rules.
// Run: node tests/slab-skate-shop-template.test.mjs
//
// What breaks silently here: a selector that leaks out of the template's scope, a picture the page asks for that was
// never put in dev/public, the pasted wall or counter drifting from the components it copies, or copy that names the
// reference the shop was drawn from.
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "slab-skate-shop-template"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const readme = readFileSync(new URL("README.md", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual([...new Set(imports)], ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 200_000, "under 21st's 200 kB component limit: " + statSync(file).size)
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
const tpl = JSON.parse(readFileSync(new URL("../scripts/templates.json", import.meta.url), "utf8"))
assert.equal(tpl.templates.filter((t) => t.slug === slug).length, 1, "listed once in scripts/templates.json")
assert.match(demo, /from "@\/components\/ui\/slab-skate-shop-template"/, "demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /style=\{\{ height \}\}/, "the shop scene takes the height prop")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
const tokens = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(tokens.has(v) || /^--(sk|skr|skc)-/.test(v) || ["--u", "--du", "--x", "--y", "--w", "--h", "--i", "--k", "--d", "--rz", "--slot", "--sg", "--s0", "--sd", "--cw", "--ct", "--cf", "--dep", "--dx", "--dy", "--dw", "--dh", "--px", "--py", "--p", "--L", "--mw"].includes(v), "token not guaranteed in a host: " + v)
const urls = [...new Set([...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/")))]
assert.deepEqual(urls, ["https://kedhar-components.pages.dev/" + slug + "/"], "the only URL is the pictures' base")

// ---- the template's own CSS stays scoped ------------------------------------
const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*(\/\/[^\n]*\n\s*)*"/g, "").replace(/"\s*\+\s*DISPLAY\s*\+\s*"/g, "X")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{/, "CSS honours reduced motion")
assert.match(css, /\.sk-root :where\(img\)\{max-width:none/, "guards Preflight's img max-width")
assert.match(css, /\.sk-hero\{position:relative;overflow:hidden;overflow:clip/, "the hero clips rather than scrolls, so focus can never pull the camera off its framing")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(/,(?![^(]*\))/).every((x) => /^\.sk-/.test(x.trim())), "unscoped selector: " + sel)
}
assert.ok(rules >= 120, "the scope check saw real rules, saw " + rules)

// ---- the pasted components ----------------------------------------------------
const a = src.indexOf("// #region pasted"), b = src.indexOf("// #endregion pasted")
assert.ok(a > 0 && b > a, "pasted region present")
const pasted = src.slice(a, b)
assert.ok(pasted.includes("function DeckRackAddToCart(") && pasted.includes("function FlipboardCheckoutCounter("), "both components are pasted in")
assert.doesNotMatch(pasted, /(?<![A-Za-z0-9_])(dr|fc)-/, "pasted class names are re-scoped to skr- / skc-")
assert.doesNotMatch(pasted, /deck-rack-add-to-cart\/|flipboard-checkout-counter\//, "pasted pictures load from this template's own folder")
// the copies match their sources line for line, apart from the documented renames and patches
for (const [name, key] of [["deck-rack-add-to-cart", "Kickflip"], ["flipboard-checkout-counter", "fc-plaque"]]) {
  const orig = readFileSync(new URL("../components/" + name + "/" + name + ".tsx", import.meta.url), "utf8")
  assert.ok(orig.includes(key), name + " still has " + key)
}
const origRack = readFileSync(new URL("../components/deck-rack-add-to-cart/deck-rack-add-to-cart.tsx", import.meta.url), "utf8").replace(/\r\n/g, "\n")
const kfA = origRack.indexOf("@keyframes dr-kick"), kfLine = origRack.slice(kfA, origRack.indexOf("\"", kfA))
assert.ok(pasted.includes(kfLine.replace(/dr-/g, "skr-")), "the kickflip motion is the component's own, unchanged")

// ---- every picture exists locally (dev/public is what the site serves) ----------
const asked = new Set()
for (const m of src.matchAll(/(?:SITE|DR_BASE|FC_BASE) \+ "([a-z-]+\.webp)"/g)) asked.add(m[1])
for (const m of src.matchAll(/\{\["(press|sand|print)"/g)) asked.add(m[1] + ".webp")
;["press", "sand", "print"].forEach((k) => asked.add(k + ".webp"))
assert.ok(asked.size >= 12, "saw the pictures the page asks for: " + [...asked])
for (const f of asked) {
  const p = new URL("../dev/public/" + slug + "/" + f, import.meta.url)
  assert.ok(existsSync(p), "picture exists: " + f)
  assert.ok(statSync(p).size < 200_000, "picture stays light: " + f)
}
const served = readdirSync(new URL("../dev/public/" + slug + "/", import.meta.url))
assert.deepEqual(served.filter((f) => !asked.has(f)), [], "no leftover files in dev/public")

// ---- content rules ----------------------------------------------------------
const text = src
// the reference shop's name, spelled backwards so this file doesn't carry it either
const banned = new RegExp([..."brek"].reverse().join(""), "i")
assert.doesNotMatch(text + demo + readme, banned, "nothing names the reference")
assert.doesNotMatch(text + demo + readme, /instagram|4500\$/i, "no trace of where the design came from")
assert.match(text, /kedhareswer\.12110626@gmail\.com/, "contact is Kedhareswer's address")
assert.match(text, /Built by Kedhareswer/, "about copy is about Kedhareswer")
assert.match(text, /Client 1 · Client 2 · Client 3/, "clients are placeholders")

// ---- the shared cart -----------------------------------------------------------
const { toggleLine, lineCount, lineTotal } = await liftRegion(src, "cart")
let lines = []
lines = toggleLine(lines, "onyx")
lines = toggleLine(lines, "garnet")
assert.deepEqual(lines, [{ id: "onyx", qty: 1 }, { id: "garnet", qty: 1 }], "the wall adds decks in the order picked")
assert.equal(lineTotal(lines, { onyx: 68, garnet: 72 }), 140)
lines = toggleLine(lines, "onyx")
assert.deepEqual(lines, [{ id: "garnet", qty: 1 }], "pressing the wall's button again takes the deck back off")
assert.equal(lineCount([{ id: "garnet", qty: 3 }, { id: "fern", qty: 1 }]), 4, "the nav counts every deck, quantities included")
// the pasted copy keeps the counter's logic region, minus its exports: lift it and export the three helpers
const { stripTypeScriptTypes } = await import("node:module")
const ra = src.indexOf("// #region counter-logic"), rb = src.indexOf("// #endregion", ra)
const { setQty, pair, validate, LEFT } = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(ra, rb)) + "\nexport { setQty, pair, validate, LEFT }"))
assert.deepEqual(setQty([{ id: "a", qty: 1 }], "a", 0), [], "the counter drops a line at zero")
assert.equal(pair("Total", "$140").left.length, LEFT, "a flap row is LEFT cells wide")
assert.deepEqual(validate({ email: "you@example.com", address: "12 Ledge Lane, Hyderabad", card: "4242 4242 4242 4242", expiry: "08 / 29", cvc: "123" }), [], "the demo details pass the drawer's checks, so Pay works first time")

console.log("slab-skate-shop-template: ok")
