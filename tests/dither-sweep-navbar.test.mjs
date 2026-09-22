// Install-safety checks plus a runnable check on the dissolve ordering.
// Run: node tests/dither-sweep-navbar.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/dither-sweep-navbar/", import.meta.url)
const src = readFileSync(new URL("dither-sweep-navbar.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const demoStrict = readFileSync(new URL("demo-strict.tsx", dir), "utf8")

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")

assert.doesNotMatch(src, /@import/, "no @import — the host project owns fonts and Tailwind")
assert.doesNotMatch(src, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full on any root element")
assert.match(src, /prefers-reduced-motion/, "honours reduced motion")

const css = src.match(/const DSN_CSS = `([\s\S]*?)`\n/)
assert.ok(css, "DSN_CSS block is present")
assert.doesNotMatch(css[1], /\$\{|`/, "no backticks or interpolation inside the CSS string")

// Every selector must be scoped, or installing this restyles someone's app.
let ruleCount = 0
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  ruleCount++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".dsn-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(ruleCount >= 20, `expected the scope check to see real rules, saw ${ruleCount}`)

// The fluid unit has to live in the stylesheet. Inline it, and the breakpoints
// below can never override it — which silently shrinks the whole bar on phones.
assert.doesNotMatch(src, /"--dsn-u"/, "--dsn-u must not be set inline")
const units = [...css[1].matchAll(/--dsn-u:\s*calc\(([\d.]+)vw/g)].map((m) => Number(m[1]))
assert.equal(units.length, 3, "one fluid unit per breakpoint")
assert.ok(
  units[0] < units[1] && units[1] < units[2],
  `the unit must grow as the viewport narrows, got ${units.join(", ")}`,
)

// Percentage heights collapse in an installed page, which has no html/body
// height chain. Inside the bar they are fine — the row is sized by the logo —
// but the root and the bar itself must stay intrinsic.
for (const sel of [".dsn-root", ".dsn-bar"]) {
  const block = css[1].match(new RegExp("\\" + sel + "\\s*\\{([^}]*)\\}"))
  assert.ok(block, `${sel} rule missing`)
  assert.doesNotMatch(block[1], /height:\s*\d+%/, `${sel} must not take a percentage height`)
}

// ---- self-contained, nothing borrowed --------------------------------------
const shipped = src + demo + demoStrict
assert.doesNotMatch(shipped, /heron/i, "must not reference the site this was studied from")
assert.doesNotMatch(shipped, /url\(["']?https?:/i, "no remote assets — nothing to 404 after install")

// ---- the dissolve ----------------------------------------------------------
const start = src.indexOf("// #region dissolve")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "dissolve region markers missing")

const js = src
  .slice(start, end)
  .replace(/^export /gm, "export ")
  .replace(/:\s*number(\[\])?(?=[,)\s=])/g, "")
const mod = await import("data:text/javascript," + encodeURIComponent(js))
const { pixelOrder, PX_COLS, PX_ROWS, PX_CELL_MS } = mod

const order = pixelOrder()
assert.equal(order.length, PX_COLS * PX_ROWS, "one delay per cell")
assert.ok(
  order.every((t) => t >= 0 && t <= 1),
  "delays are a 0..1 fraction of the sweep, so durationMs stays the whole budget",
)

// Deterministic: the server and the client must agree, or hydration warns.
assert.deepEqual(pixelOrder(), order, "pixelOrder must not use Math.random")

// The sweep runs left to right: each column's mean arrival is later than the last.
const colMean = Array.from({ length: PX_COLS }, (_, c) => {
  let sum = 0
  for (let r = 0; r < PX_ROWS; r++) sum += order[r * PX_COLS + c]
  return sum / PX_ROWS
})
// Smoothed into blocks: single columns overlap on purpose, that is the grain.
const blocks = []
for (let c = 0; c < PX_COLS; c += 4) {
  blocks.push(colMean.slice(c, c + 4).reduce((a, b) => a + b, 0) / 4)
}
for (let i = 1; i < blocks.length; i++) {
  assert.ok(blocks[i] > blocks[i - 1], `block ${i} does not arrive after block ${i - 1}`)
}
assert.ok(colMean[0] < 0.2 && colMean[PX_COLS - 1] > 0.8, "the sweep must span the whole budget")

// …but not as a clean wipe. Neighbouring columns have to interleave, or the
// edge reads as a hard line instead of grain.
let interleaved = 0
for (let c = 1; c < PX_COLS; c++) {
  for (let r = 0; r < PX_ROWS; r++) {
    if (order[r * PX_COLS + c] < colMean[c - 1]) interleaved++
  }
}
assert.ok(interleaved >= 12, `leading edge is too clean to read as pixels (${interleaved} overlaps)`)

// Several ranks of cells must be mid-fade at once for the same reason.
const spread = 1 - PX_CELL_MS / 500
assert.ok(PX_CELL_MS >= 150, `cell fade ${PX_CELL_MS}ms is too short to grain the edge`)
assert.ok(spread > 0, "the cell fade must leave room for the sweep")

console.log("dither-sweep-navbar: ok")
