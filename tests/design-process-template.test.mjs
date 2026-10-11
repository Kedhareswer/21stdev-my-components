// Install-safety and logic checks for components/design-process-template.
// Run: node tests/design-process-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "design-process-template"
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
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(|<img\b/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no external URL")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: height/, "the height prop reaches the root")
assert.doesNotMatch(src, /\bh-full\b|height:100%/, "no percentage heights")
assert.match(src, /React\.useId\(\)/, "ids are namespaced per instance")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>, so the 21st CLI tokenizer stays linear")
assert.doesNotMatch(src, /location\.hash|history\.(push|replace)State/, "the host's URL is untouched")

const css = src.match(/const DP_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^(a\.)?\.?dp-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.dp-root :where\(button\)\{/, "base resets carry no specificity")
assert.match(css[1], /\.dp-root :where\(svg\)\{display:block;max-width:none/, "svg guarded against Preflight")
assert.match(css[1], /\.dp-root\{[^}]*container-type:inline-size/, "lays out from its own width")
assert.match(css[1], /var\(--color-background/, "follows the host's background token")
assert.match(css[1], /\.dp-w\{[^}]*text-indent:0/, "word masks don't inherit the headline indent")
assert.match(css[1], /\.dp-root\[data-anim="on"\] \.dp-head:not\(\[data-seen\]\)/, "hidden-before-reveal only once JS has mounted")

/* ---------- the interactions are wired ---------- */

assert.match(src, /aria-pressed=\{!!role && tagKey\(role\) === tagKey\(r\)\}/, "role chips are toggle buttons")
assert.match(src, /aria-pressed=\{pinnedTag === k\}/, "activity chips are toggle buttons")
assert.match(src, /onRoleChange\?\.\(next\)/, "role changes are reported")
assert.match(src, /onTagSelect\?\.\(next\)/, "tag pins are reported")
assert.match(src, /e\.key === "Escape"/, "Escape clears the filters")
assert.match(src, /scrollIntoView\(/, "allocation segments jump to their phase")
assert.match(src, /aria-live="polite"/, "filter results are announced")
assert.ok(read("demo.tsx").includes("<DesignProcessTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- logic, executed ---------- */

const L = await import(
  "data:text/javascript," +
    encodeURIComponent(
      stripTypeScriptTypes(region("logic")) +
        "\nexport { parseHeadline, clampPercent, allocation, tagKey, tagCounts, phaseHasRole, easeOutCubic, countValue, statusLine }\n",
    )
)

assert.deepEqual(L.parseHeadline("of phases {icon} from"), [
  { kind: "word", value: "of" },
  { kind: "word", value: "phases" },
  { kind: "icon" },
  { kind: "word", value: "from" },
])
assert.deepEqual(L.parseHeadline("a{icon}b"), [{ kind: "word", value: "a" }, { kind: "icon" }, { kind: "word", value: "b" }])
assert.deepEqual(L.parseHeadline("  no   badge "), [{ kind: "word", value: "no" }, { kind: "word", value: "badge" }])

assert.equal(L.clampPercent(140), 100)
assert.equal(L.clampPercent(-3), 0)
assert.equal(L.clampPercent(NaN), 0)

assert.deepEqual(L.allocation([15, 30, 15, 40]), [
  { start: 0, width: 15 },
  { start: 15, width: 30 },
  { start: 45, width: 15 },
  { start: 60, width: 40 },
])
assert.deepEqual(L.allocation([10, 10]), [{ start: 0, width: 50 }, { start: 50, width: 50 }], "normalised when the sum isn't 100")
assert.deepEqual(L.allocation([0, 0]), [{ start: 0, width: 50 }, { start: 50, width: 50 }], "all zero splits evenly")

assert.equal(L.tagKey("  UX   Design "), "ux design")
assert.deepEqual(L.tagCounts([["Research", "Testing"], ["research"], ["Testing", "Testing"]]), { research: 2, testing: 2 }, "counted once per phase, case-insensitive")

assert.ok(L.phaseHasRole(["Director"], "director"))
assert.ok(!L.phaseHasRole(["Director"], "Project manager"))
assert.ok(L.phaseHasRole(undefined, "Director"), "a phase without roles counts everyone")
assert.ok(L.phaseHasRole(["Director"], null), "no filter matches all")

assert.equal(L.easeOutCubic(0), 0)
assert.equal(L.easeOutCubic(2), 1, "clamped")
assert.equal(L.countValue(40, 0), 0)
assert.equal(L.countValue(40, 1), 40)

assert.equal(L.statusLine(null, null, 0, 0, 4), "")
assert.equal(L.statusLine("Director", null, 2, 0, 4), "2 of 4 phases with Director")
assert.equal(L.statusLine(null, "Research", 0, 1, 4), "Research in 1 phase")
assert.equal(L.statusLine("Director", "Testing", 2, 2, 4), "2 of 4 phases with Director · Testing in 2 phases")

console.log("design-process-template: ok")
