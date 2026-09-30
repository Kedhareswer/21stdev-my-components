// Install-safety and logic checks for components/quiet-portfolio-template.
// Run: node tests/quiet-portfolio-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "quiet-portfolio-template"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const region = (name) => {
  const a = src.indexOf(`// #region ${name}\n`)
  const b = src.indexOf(`// #endregion ${name}\n`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a, b)
}

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: height/, "the height prop reaches the root")
assert.doesNotMatch(src, /\bh-full\b|height:100%/, "no percentage heights")
assert.match(src, /React\.useId\(\)/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "svg references are built from the instance id")
assert.match(src, /<img [^>]*style=\{\{ maxWidth: "none" \}\}/, "a custom avatar image is guarded against Preflight")
assert.match(src, /<img [^>]*width=\{56\} height=\{56\}/, "a custom avatar image has explicit size")
assert.doesNotMatch(src, /location\.hash|history\.(push|replace)State/, "views stay internal; the host's URL is untouched")

const css = src.match(/const QPT_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion")
const bare = css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "")
for (const m of bare.matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(",")) assert.match(s.trim(), /^[a-z]*\.qpt-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.qpt-root :where\(button\)\{/, "base resets carry no specificity, so component classes win")
assert.match(css[1], /\.qpt-root :where\(svg\)\{display:block;max-width:none/, "svg guarded against Preflight")
assert.match(css[1], /\.qpt-prose ul\{[^}]*list-style:disc/, "essay lists survive Preflight's list reset")

/* ---------- the interactions are wired ---------- */

assert.match(src, /\(e\.metaKey \|\| e\.ctrlKey\) && e\.key\.toLowerCase\(\) === "k"/, "⌘K / Ctrl+K opens the palette")
assert.match(src, /role="dialog" aria-modal="true"/, "the palette is a modal dialog")
assert.match(src, /aria-activedescendant=/, "the palette's selection is announced")
assert.match(src, /aria-expanded=\{rolesOpen\}/, "previous roles fold is a disclosure")
assert.match(src, /aria-expanded=\{isOpen\}/, "project rows are disclosures")
assert.match(src, /aria-current=\{tab === "home" \? "page" : undefined\}/, "the nav marks the current page")
assert.match(src, /data-theme=\{theme\}/, "the theme is scoped to the root")
assert.match(src, /classList\.contains\("dark"\)/, "system theme follows the host's .dark class")
assert.ok(read("demo.tsx").includes("<QuietPortfolioTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- text, search and art helpers, executed ---------- */

const code = region("text") + region("search") + region("art") +
  "\nexport { parseBlock, groupBlocks, readingMinutes, formatDate, yearOf, scoreMatch, filterCommands, hashString }\n"
const E = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

assert.deepEqual(E.parseBlock("## Heading "), { kind: "h", text: "Heading" })
assert.deepEqual(E.parseBlock("> quoted"), { kind: "quote", text: "quoted" })
assert.deepEqual(E.parseBlock("- item"), { kind: "li", text: "item" })
assert.deepEqual(E.parseBlock("plain"), { kind: "p", text: "plain" })
assert.deepEqual(
  E.groupBlocks(["a", "- x", "- y", "", "b", "- z"]).map((b) => b.kind + ":" + (b.items ?? [b.text]).join("|")),
  ["p:a", "list:x|y", "p:b", "list:z"],
  "consecutive items become one list; blank lines vanish",
)

assert.equal(E.readingMinutes([]), 1, "never zero minutes")
assert.equal(E.readingMinutes([Array(660).fill("w").join(" ")]), 3)

assert.equal(E.formatDate("2026-08-14", true), "Aug 14, 2026")
assert.equal(E.formatDate("2026-01-01", false), "Jan 1", "no timezone drift on the first of the month")
assert.equal(E.formatDate("someday", true), "someday", "unparseable dates pass through")
assert.equal(E.yearOf("2025-03-09"), "2025")

assert.equal(E.scoreMatch("", "anything"), 0)
assert.equal(E.scoreMatch("xyz", "Essays"), -1)
assert.ok(E.scoreMatch("ess", "Essays") > E.scoreMatch("ess", "Previous roles essay"), "prefix beats buried")
assert.ok(E.scoreMatch("wcf", "Write the changelog first") > 0, "word initials match")
assert.ok(E.scoreMatch("dark", "Switch to dark theme") > E.scoreMatch("dark", "divider in a stack"), "runs beat scatter")

const cmds = [
  { id: "home", group: "Pages", label: "Home" },
  { id: "essays", group: "Pages", label: "Essays" },
  { id: "p", group: "Recent work", label: "Peek", keywords: "AI extension" },
  { id: "t", group: "Actions", label: "Switch to dark theme", keywords: "mode" },
]
assert.deepEqual(E.filterCommands(cmds, "  ").map((c) => c.id), ["home", "essays", "p", "t"], "empty query keeps order")
assert.equal(E.filterCommands(cmds, "ess")[0].id, "essays")
assert.equal(E.filterCommands(cmds, "extension")[0].id, "p", "keywords are searched")
assert.equal(E.filterCommands(cmds, "mode")[0].id, "t")
assert.deepEqual(E.filterCommands(cmds, "qqq"), [])

assert.equal(E.hashString("Dot"), E.hashString("Dot"), "covers are stable")
assert.notEqual(E.hashString("Dot"), E.hashString("Dots"))
assert.ok(Number.isInteger(E.hashString("x")) && E.hashString("x") >= 0, "unsigned 32-bit")

console.log("quiet-portfolio-template: ok")
