// Install-safety and deck-logic checks for components/swipe-stack-cards.
// Run: node tests/swipe-stack-cards.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/swipe-stack-cards/", import.meta.url)
const src = readFileSync(new URL("swipe-stack-cards.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap"], "imports react and gsap only")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "swipe-stack-cards.tsx"])
assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect|LayoutEffect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.ok(src.length < 40_000, "the component stays lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(from|to|\d+%)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".ssc-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 30, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.ssc-ph>img\{[^}]*max-width:none/, "card photos override Preflight's max-width")
assert.match(flat, /\.ssc-halo>img\{[^}]*max-width:none/, "the halo overrides Preflight's max-width")
const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
for (const m of src.matchAll(/var\((--[a-z-]+)(,[^)]*)?\)/g)) assert.ok(m[2], "every token has a fallback: " + m[0])
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- runtime hygiene -------------------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS animations honour reduced motion")
assert.ok(src.includes('fast ? "power1.out" : "elastic.out(1,0.78)"'), "reduced motion drops the elastic")
assert.ok(src.includes("new ResizeObserver") && src.includes("entries[0].contentRect"), "sizes come from ResizeObserver")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height|X|Y)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
// Only the card grabs touches; the page keeps scrolling everywhere else.
assert.equal(flat.match(/touch-action:none/g)?.length, 1, "touch-action:none appears once")
assert.match(flat, /\.ssc-card\{[^}]*touch-action:none/, "and only on the cards")
assert.ok(src.includes('el.style.pointerEvents = k === 0 ? "auto" : "none"'), "only the front card takes the pointer")
assert.doesNotMatch(src, /addEventListener\("wheel"|passive: false/, "the wheel is never captured")
for (const gone of ['deck.removeEventListener("pointermove", onMove)', 'deck.removeEventListener("pointerup", onUp)', "ro.disconnect()", 'mq.removeEventListener("change", onMq)', "ctx.revert()"])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")
assert.doesNotMatch(src, /autoplay|setInterval/, "no autoplay")

// ---- the lifted deck logic -----------------------------------------------------------
const start = src.indexOf("// #region deck")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "deck region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.deepEqual(L.sendBack([0, 1, 2, 3]), [1, 2, 3, 0])
assert.deepEqual(L.bringFront([1, 2, 3, 0]), [0, 1, 2, 3], "bringFront undoes sendBack")
assert.deepEqual(L.sendBack([5]), [5])
assert.deepEqual(L.bringFront([]), [])
const o = [0, 1, 2]
L.sendBack(o)
assert.deepEqual(o, [0, 1, 2], "orders are not mutated")
assert.deepEqual(L.slotPose(0, 16), { y: -0, scale: 1, dim: 0, opacity: 1 })
assert.ok(L.slotPose(2, 16).y < L.slotPose(1, 16).y, "cards behind peek higher")
assert.equal(L.slotPose(5, 16).opacity, 0, "deep cards are hidden")
assert.deepEqual(L.slotPose(6, 16).y, L.slotPose(3, 16).y, "and wait in the last visible slot")
assert.equal(L.releaseAction(200, 0, 120), 1)
assert.equal(L.releaseAction(20, 1200, 120), 1, "a flick deals too")
assert.equal(L.releaseAction(40, 100, 120), 0, "a small drag springs back")
assert.equal(L.releaseAction(-100, 0, 120), -1, "upwards brings the last card back")
assert.equal(L.dragY(50), 50)
assert.ok(L.dragY(-100) > -100 && L.dragY(-100) < 0, "upwards drags are stiffer")
assert.equal(L.initials("Ines Varga"), "IV")
assert.equal(L.initials("  tom  okafor smith "), "TO")

console.log("swipe-stack-cards: ok")
