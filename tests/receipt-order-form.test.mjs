// Runnable check for components/receipt-order-form: validation, quantities, the
// estimate, and the install-safety rules.
// Run: node tests/receipt-order-form.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) => readFileSync(new URL("../components/receipt-order-form/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("receipt-order-form.tsx")

const start = src.indexOf("// #region order")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "order region markers missing")
const O = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- validation -------------------------------------------------------------
{
  const ok = { name: "Jo", email: "jo@park.io", items: 1, message: "" }
  assert.deepEqual(O.validateOrder(ok), {})
  assert.deepEqual(O.validateOrder({ ...ok, items: 0, message: "hi" }), {}, "a message alone is an order")
  assert.ok(O.validateOrder({ ...ok, name: "   " }).name)
  assert.ok(O.validateOrder({ ...ok, email: "" }).email.includes("required"))
  assert.ok(O.validateOrder({ ...ok, email: "jo@park" }).email.includes("wrong"))
  assert.ok(O.validateOrder({ ...ok, email: " jo@park.io " }).email === undefined, "surrounding space is forgiven")
  assert.ok(O.validateOrder({ ...ok, items: 0, message: " " }).services)
  assert.deepEqual(Object.keys(O.validateOrder({ name: "", email: "", items: 0, message: "" })).sort(), ["email", "name", "services"])
}

// ---- quantities and estimate ---------------------------------------------------
{
  assert.equal(O.clampQty(4, 3), 3)
  assert.equal(O.clampQty(-1, 3), 0)
  assert.equal(O.clampQty(1.6, 3), 2)
  assert.equal(O.clampQty(NaN, 3), 0)
  assert.equal(O.clampQty(2, -1), 0)
  assert.equal(O.estimateWeeks([]), 0)
  assert.equal(O.estimateWeeks([{ qty: 0, weeks: 5 }]), 0)
  assert.equal(O.estimateWeeks([{ qty: 1, weeks: 5 }]), 5)
  assert.equal(O.estimateWeeks([{ qty: 1, weeks: 5 }, { qty: 2, weeks: 3 }]), 9, "longest line in full, the rest at half, rounded up: 6 + 5/2")
  assert.equal(O.estimateWeeks([{ qty: 1, weeks: 2 }, { qty: 1, weeks: 5 }]), O.estimateWeeks([{ qty: 1, weeks: 5 }, { qty: 1, weeks: 2 }]), "order doesn't matter")
  let prev = 0
  for (let q = 1; q < 6; q++) {
    const w = O.estimateWeeks([{ qty: 1, weeks: 4 }, { qty: q, weeks: 2 }])
    assert.ok(w >= prev, "more work never estimates less")
    prev = w
  }
  assert.equal(O.orderNumber("A", 1), "A-001")
  assert.equal(O.orderNumber("", 42), "042")
}

// ---- shared pieces -----------------------------------------------------------------
assert.equal(O.pixelRuns("ORDER").cols, 29)
assert.ok(O.zigzagClip(40, 7).startsWith("polygon(0 0, 100% 0"))

// ---- install safety ------------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"])
assert.doesNotMatch(src.replaceAll("http://www.w3.org/2000/svg", ""), /https?:\/\//)

const styleBlock = src.slice(src.indexOf("const styles = ["), src.indexOf('].join("\\n")'))
assert.ok(styleBlock.length > 500)
assert.doesNotMatch(styleBlock, /[`]|\$\{/)
assert.doesNotMatch(styleBlock, /@import/)
assert.ok(styleBlock.includes("prefers-reduced-motion"))
for (const [, rule] of styleBlock.matchAll(/^\s*"([^"\\]*(?:\\.[^"\\]*)*)",?$/gm)) {
  const sel = rule.split("{")[0].trim()
  if (!sel || sel.startsWith("@") || sel === "}" || !rule.includes("{")) continue
  for (const s of sel.split(",")) assert.ok(s.trim().startsWith(".ro-"), "selector escapes the component: " + s)
}

assert.ok(/height = "100svh"/.test(src))
assert.doesNotMatch(src, /\bh-(full|screen)\b/)
assert.ok(src.includes('maxWidth: "none"'))
assert.ok(src.includes("noValidate"), "errors print on the slip, not as browser bubbles")
assert.ok(src.includes("await pending.current"), "the printer waits for onSubmit")
assert.ok(src.includes("catch (err)"), "a failed submit comes back as an error")
assert.ok(src.includes("[services.length]"), "an inline services array doesn't loop the effect")
assert.ok(src.includes("aria-invalid"))
assert.ok(src.includes('role="radiogroup"') && src.includes('role="radio"'))
assert.ok(src.includes('aria-live="polite"'))
assert.ok(src.includes('mq.removeEventListener("change"'))

for (const f of ["demo.tsx", "demo-night.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/receipt-order-form"'))
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), f + ": " + cls)
}

console.log("receipt-order-form: ok")
