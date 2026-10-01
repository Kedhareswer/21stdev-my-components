// Install-safety checks plus a runnable check on the colour helpers.
// Run: node tests/frosted-glass-menu.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/frosted-glass-menu/", import.meta.url)
const src = readFileSync(new URL("frosted-glass-menu.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const demoStrict = readFileSync(new URL("demo-strict.tsx", dir), "utf8")

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")

assert.doesNotMatch(src, /@import/, "no @import — the host project owns fonts and Tailwind")
assert.doesNotMatch(src, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full on any element")
assert.match(src, /prefers-reduced-motion/, "honours reduced motion")

const css = src.match(/const FGM_CSS = `([\s\S]*?)`\n/)
assert.ok(css, "FGM_CSS block is present")
assert.doesNotMatch(css[1], /\$\{|`/, "no backticks or interpolation inside the CSS string")

// Every selector must be scoped, or installing this restyles someone's app.
let ruleCount = 0
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  ruleCount++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".fgm-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(ruleCount >= 40, `expected the scope check to see real rules, saw ${ruleCount}`)

// The root and the slot stay intrinsic: an installed page has no html/body
// height chain, so a percentage height here collapses to 0px.
for (const sel of [".fgm-root", ".fgm-slot", ".fgm-card"]) {
  const block = css[1].match(new RegExp("\\" + sel + "\\s*\\{([^}]*)\\}"))
  assert.ok(block, `${sel} rule missing`)
  assert.doesNotMatch(block[1], /height:\s*\d+%/, `${sel} must not take a percentage height`)
}

// Preflight sets img/svg { max-width: 100% }. Every sized svg opts out of it.
for (const sel of [".fgm-logo svg", ".fgm-arrow svg", ".fgm-mascot > svg"]) {
  const block = css[1].match(new RegExp(sel.replace(/[.>]/g, "\\$&") + "\\s*\\{([^}]*)\\}"))
  assert.ok(block, `${sel} rule missing`)
  assert.match(block[1], /max-width:\s*none/, `${sel} must guard against Preflight`)
  if (sel !== ".fgm-logo svg") assert.match(block[1], /width:\s*\d+px/, `${sel} needs an explicit size`)
}

// The open panel must never be taller than the screen, or the end of the
// index (and the footer) is unreachable on a phone.
assert.match(css[1], /\.fgm-fold-inner\s*\{[^}]*max-height:\s*calc\(100svh/, "the panel caps its height")
assert.match(css[1], /\.fgm-fold-inner\s*\{[^}]*overflow:\s*hidden auto/, "and scrolls inside the glass")

// ---- behaviour, read off the source ----------------------------------------
assert.match(src, /aria-expanded=\{open\}/, "toggle reports its state")
assert.match(src, /aria-controls=\{panelId\}/, "toggle names the panel it controls")
assert.match(src, /e\.key !== "Escape"/, "Escape closes")
assert.match(src, /toggleAttribute\("inert", !open\)/, "a folded panel is out of the tab order")
// React 18 has no inert prop: passing one warns and does nothing.
assert.doesNotMatch(src, /\binert=\{/, "inert must be set as an attribute, not a prop")

// ---- self-contained, nothing borrowed --------------------------------------
const shipped = src + demo + demoStrict
assert.doesNotMatch(shipped, /\batlas\b/i, "must not reference the site this was studied from")
assert.doesNotMatch(shipped, /https?:\/\/(?!www\.w3\.org)/i, "no remote assets — nothing to 404 after install")
assert.match(demo, /from "@\/components\/ui\/frosted-glass-menu"/, "demo imports the installed path")

// ---- colour helpers ---------------------------------------------------------
const start = src.indexOf("// #region glass")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "glass region markers missing")
const js = src.slice(start, end).replace(/\((\w+): string\): string/g, "($1)")
const { solidGlass, strongerRule } = await import("data:text/javascript," + encodeURIComponent(js))

assert.equal(solidGlass("rgba(238, 235, 231, 0.74)"), "rgb(238, 235, 231)")
assert.equal(solidGlass("rgba(24,24,30,.55)"), "rgb(24, 24, 30)")
assert.equal(solidGlass("rgb(10 20 30 / 0.5)"), "rgb(10, 20, 30)")
assert.equal(solidGlass("#eeebe7"), "#eeebe7", "a non-rgb colour passes through")

assert.equal(strongerRule("rgba(20, 18, 16, 0.14)"), "rgba(20, 18, 16, 0.32)")
assert.equal(strongerRule("rgb(20, 18, 16)"), "rgb(20, 18, 16)", "an opaque rule has no alpha to raise")
assert.equal(strongerRule("#ddd"), "#ddd")

console.log("frosted-glass-menu: ok")
