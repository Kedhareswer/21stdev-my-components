// Install-safety and validation checks for components/cascade-signup-form.
// Run: node tests/cascade-signup-form.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "cascade-signup-form"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", slug + ".tsx", "demo.tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments")
assert.doesNotMatch(src, /dangerouslySetInnerHTML/, "no raw HTML")
assert.ok(src.length < 100_000, "lean: " + src.length)
assert.ok(demo.length < 200_000, "demo under 200 KB: " + demo.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "").replace(/url\([^)]*\)/g, "url()")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel.startsWith("FONT") || /^(from|to|\d+%)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".csf-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 80, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.csf-art>img\{[^}]*max-width:none/, "the photo overrides Preflight")
assert.match(flat, /\.csf-faces>img\{[^}]*max-width:none/, "faces override Preflight")
assert.match(flat, /\.csf-root\{[^}]*container-type:inline-size/, "lays out by container, not viewport")
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(v.startsWith("--csf-"), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")
assert.deepEqual([...demo.matchAll(/["'(]https?:\/\//g)], [], "demo is self-contained")

// ---- a11y and motion ---------------------------------------------------------------
assert.ok(src.includes("noValidate") && src.includes('<form'), "a real form with our own validation")
assert.ok(src.includes('htmlFor={uid + k}') && src.includes("aria-invalid={!!err}"), "labelled, invalid state exposed")
assert.ok(src.includes('aria-describedby={err ? uid + k + "-e"'), "messages are linked")
assert.ok(src.includes('<fieldset') && src.includes('<legend') && src.includes('type="radio"'), "roles are a radio group")
assert.ok(src.includes('aria-current={i === step ? "step" : undefined}'), "current step marked")
assert.ok(src.includes('role="alert"') && src.includes('aria-live="polite"'), "errors and progress announced")
assert.ok(src.includes("focusFirstBad"), "focus moves to the first problem")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "reduced motion honoured")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")

// ---- the lifted logic ------------------------------------------------------------
const start = src.indexOf("// #region validation")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.ok(L.EMAIL_RE.test("ana@northlight.co"))
assert.ok(!L.EMAIL_RE.test("ana@northlight"), "needs a TLD")
assert.ok(!L.EMAIL_RE.test("ana @x.io"), "no spaces")
assert.equal(L.strength(""), 0)
assert.equal(L.strength("abc"), 1)
assert.equal(L.strength("ABCdef12"), 3)
assert.equal(L.strength("Moonrise7!"), 4)
assert.equal(L.strength("aB3$"), 1, "short passwords stay weak however varied")
assert.equal(L.strength("abcdefghijklmnop1"), 2)
assert.equal(L.STRENGTH[4], "Strong")
const blank = { name: "", email: "", password: "", confirm: "", role: "", terms: false }
assert.deepEqual(L.validateStep(0, blank), { name: "Tell us your name", email: "Email is required" })
assert.equal(L.validateStep(0, { ...blank, name: "Ana", email: "nope" }).email, "That email doesn't look right")
assert.deepEqual(L.validateStep(0, { ...blank, name: "Ana", email: "a@b.co" }), { name: "", email: "" })
assert.equal(L.validateStep(1, { ...blank, password: "abc" }).password, "Make it stronger: see the checklist")
assert.equal(L.validateStep(1, { ...blank, password: "Moonrise7!", confirm: "Moonrise7" }).confirm, "Passwords don't match")
assert.deepEqual(L.validateStep(1, { ...blank, password: "Moonrise7!", confirm: "Moonrise7!" }), { password: "", confirm: "" })
assert.deepEqual(L.validateStep(2, blank), { role: "Pick the one closest to you", terms: "Accept the terms to continue" })
assert.deepEqual(L.validateStep(2, { ...blank, role: "Designer", terms: true }), { role: "", terms: "" })

console.log(slug + ": ok")
