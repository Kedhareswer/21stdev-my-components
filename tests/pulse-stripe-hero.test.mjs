// Install-safety and helper checks for components/pulse-stripe-hero.
// Run: node tests/pulse-stripe-hero.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/pulse-stripe-hero/", import.meta.url)
const src = readFileSync(new URL("pulse-stripe-hero.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "imports are react and gsap only")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo-ember.tsx", "demo.tsx", "pulse-stripe-hero.tsx"])
assert.ok(src.includes('height = "calc(100svh - 24px)"'), "card height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|LayoutEffect|Effect)</, "no generic hook type arguments")
assert.ok(src.length < 120_000, "lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel === "FONT +" || /^(to|from|\d+%)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".psh-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 30, "the scope check saw real rules, saw " + rules)
const allowed = new Set(["--psh-from", "--psh-to", "--psh-glow", "--psh-ink", "--color-background", "--color-foreground", "--color-muted-foreground"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org")), [], "fetches nothing")

// motion and runtime hygiene: the stripes are CSS transforms; JS only counts and scrubs
assert.match(flat, /@keyframes psh-pulse\{0%\{transform:translateY\(0\)\}100%\{transform:translateY\(270%\)\}\}/, "the pulse moves by transform only")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)\{[^}]*\.psh-col>i,\.psh-track\{animation:none\}/, "reduced motion stops the pulse and the band")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS")
assert.ok(src.includes("ctx.revert()") && src.includes("cancelAnimationFrame(raf)"), "cleanup")
assert.ok(src.includes("once: true") && src.includes("scrub: 0.6"), "stats count once; the statement scrubs")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.ok(src.includes("aria-label={statement}") && src.includes('aria-hidden={copy === 1 ? "true" : undefined}'), "the statement reads whole; the band's copy is hidden")

const start = src.indexOf("// #region format")
const end = src.indexOf("// #endregion", start)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.equal(L.formatStat(14200), "14,200")
assert.equal(L.formatStat(99.987, 2, "", "%"), "99.99%")
assert.equal(L.formatStat(2.4, 1, "$", "B"), "$2.4B")
assert.equal(L.formatStat(-3), "0", "never negative while easing")
assert.equal(L.formatStat(1234567.5, 1), "1,234,567.5")
assert.equal(L.stripeDelay(0, 16), -0)
assert.ok(L.stripeDelay(8, 16) < 0 && L.stripeDelay(8, 16) > -4.2, "delays stay within one period")
assert.equal(L.stripeDelay(3, 0), 0)
assert.deepEqual(L.words("  Monday is  for deciding. "), ["Monday", "is", "for", "deciding."])

console.log("pulse-stripe-hero: ok")
