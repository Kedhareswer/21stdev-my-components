// Install-safety check for components/tile-scrollbar.
// Run: node tests/tile-scrollbar.test.mjs
//
// This component is the one kind that can legitimately reach outside itself —
// it reads window scroll and hides the host's scrollbar — so the failures worth
// guarding are the ones where that reach becomes permanent, global, or
// dependent on styling this repo happens to have and an installer does not.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/tile-scrollbar/", import.meta.url)
const src = readFileSync(new URL("tile-scrollbar.tsx", dir), "utf8")
const styles = src.slice(src.indexOf("const styles = `") + 16, src.lastIndexOf("`"))
assert.ok(styles.length > 500, "could not lift the styles block")

// 21st ships this file alone. Anything that assumes the host's stylesheet, or
// restyles the host's page, does not survive the trip.
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(styles, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(styles, /\$\{|`/, "no backticks or interpolation inside the CSS string")

// Hiding the native scrollbar is the one host-document change it makes. It must
// be attribute-scoped (so a page without this component is untouched) and it
// must come back off — an unmount that leaves the page unscrollable-looking is
// the worst bug this component can have.
assert.ok(
  /\[data-tsb-hide-scrollbar\][\s\S]*scrollbar-width:\s*none/.test(styles),
  "scrollbar hiding must be scoped to the opt-in attribute",
)
assert.ok(
  src.includes('setAttribute("data-tsb-hide-scrollbar"') &&
    src.includes('removeAttribute("data-tsb-hide-scrollbar")'),
  "the hide attribute must be removed on unmount",
)

// Every listener it adds is on window/document, which outlive the component.
// Each addEventListener needs its removeEventListener, or a remount doubles the
// scroll work and the old closure keeps writing to detached nodes.
for (const target of ["scroll", "resize"]) {
  const added = src.match(new RegExp('addEventListener\\("' + target + '"', "g")) ?? []
  const removed = src.match(new RegExp('removeEventListener\\("' + target + '"', "g")) ?? []
  assert.equal(
    added.length,
    removed.length,
    `${target}: ${added.length} listener(s) added, ${removed.length} removed`,
  )
}
assert.ok(src.includes("ro.disconnect()"), "the ResizeObserver must be disconnected")

// Colours come only from the two tokens a 21st component may assume, each with
// a literal fallback, so there is no light/dark branch to get wrong and no
// blank component on a page that defines neither.
assert.ok(
  styles.includes("var(--color-background, ") && styles.includes("var(--color-foreground, "),
  "theme tokens must carry literal fallbacks",
)
assert.doesNotMatch(
  styles,
  /prefers-color-scheme|\.dark\b/,
  "no theme branch — the tray mixes its greys from the host's tokens",
)

// The tray is fixed and self-sizing. A percentage height anywhere below the
// root collapses to 0px on a page with no html/body height chain.
assert.doesNotMatch(styles, /height:\s*(100%|[0-9.]+%)/, "no percentage heights")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")

// Motion is not optional.
assert.ok(
  /@media \(prefers-reduced-motion: reduce\)/.test(styles),
  "must honour prefers-reduced-motion in CSS",
)
assert.ok(
  src.includes('behavior: smooth && !reduce.matches ? "smooth" : "auto"'),
  "must honour prefers-reduced-motion for programmatic scrolling",
)

// role="scrollbar" is only true if it behaves like one.
for (const need of [
  'role="scrollbar"',
  "aria-valuenow",
  "aria-valuetext",
  "tabIndex={0}",
  '"PageDown"',
  '"Home"',
  '"End"',
]) {
  assert.ok(src.includes(need), `missing ${need} — role="scrollbar" would be a lie`)
}

// Demos import the path an installer ends up with, not a relative one.
for (const file of ["demo.tsx", "demo-plain.tsx"]) {
  const demo = readFileSync(new URL(file, dir), "utf8")
  assert.ok(
    demo.includes('from "@/components/ui/tile-scrollbar"'),
    `${file} must import the installed path`,
  )
  assert.doesNotMatch(demo, /\bh-full\b/, `${file}: no h-full — the demo must scroll the page`)
}

console.log("tile-scrollbar: ok")
