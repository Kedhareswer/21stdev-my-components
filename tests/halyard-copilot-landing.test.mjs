// Install-safety and logic checks for components/halyard-copilot-landing.
// Run: node tests/halyard-copilot-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "halyard-copilot-landing"
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
const hosts = new Set([...src.matchAll(/https?:\/\/([^/"'\s]+)/g)].map((m) => m[1]))
assert.deepEqual([...hosts], ["images.unsplash.com"], "the only remote host is the avatar photos")
assert.match(src, /onError=\{\(\) => setFailed\(true\)\}/, "an avatar that can't load falls back to initials")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: "max\(420px, calc\(" \+ height/, "the height prop reaches the hero")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const m of src.matchAll(/([^{}]+)\{[^}]*(?<![-\w])height:100%/g))
  assert.match(m[1].trim(), /^\.hcl-(img|grain|margin-bar i|conf i::after|who-bar i)$/, `percentage height on ${m[1].trim()}`)
assert.match(src, /\.hcl-app\{[^}]*height:640px/, "the app has a definite height")
assert.match(src, /\.hcl-vis\{[^}]*height:520px/, "the how-it-works stage has a definite height")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "filter and path references are built from the instance id")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback|Context)<|Record<|Array<|Promise<|Partial</, "no <generics> for the 21st CLI tokenizer to choke on")
assert.doesNotMatch(src, /\\u[0-9a-f]{4}/i, "no \\u escapes: they print literally in JSX text")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (streams, tilt, counters, orbits)")

const css = src.match(/const HCL_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^(:where\(\.dark\) )?\.hcl-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.hcl-svg\{display:block;max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.hcl-img\{display:block;max-width:none/, "and so are photos")
assert.match(css[1], /\.hcl-root :where\(button\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.hcl-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.doesNotMatch(css[1], /\.hcl-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav")
assert.match(css[1], /\.hcl-nav\{position:sticky/, "the nav sticks")
assert.match(css[1], /:where\(\.dark\) \.hcl-root\[data-scheme=auto\]/, "scheme=auto follows the host's dark class")
assert.match(css[1], /\.hcl-app\{[^}]*rotateX\(calc\(var\(--t\)/, "the app's tilt is driven by one scroll variable")

/* ---------- it behaves like a product ---------- */

for (const k of ["top", "product", "how", "quotes", "numbers", "voices", "contact"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /role="tablist" aria-label="Copilot views"/, "the app's views are tabs")
assert.match(src, /role="tablist" aria-label="Thread status"/, "and so are the inbox's statuses")
assert.match(src, /filterThreads\(threads, status, query\)/, "search and status filter the inbox")
assert.match(src, /contentEditable=\{!readOnly\}/, "the draft is editable, and only while it is open")
assert.match(src, /document\.execCommand\(cmd, false, value\)/, "the toolbar formats the draft")
assert.match(src, /document\.queryCommandState\(c\)/, "and reflects the selection's formatting")
assert.match(src, /startStream\(thread\.id, rewriteDraft\(thread\.draft, tone\)\)/, "rewrite re-streams the draft in another tone")
assert.match(src, /onSend\(\{ thread, subject: m\.subject, html, recipients: m\.recipients \}\)/, "send hands the edited draft to the host")
assert.match(src, /label: "Undo"/, "sending and moving threads can be undone")
assert.match(src, /if \(!isEmail\(v\)\)/, "recipients are validated")
assert.match(src, /answerFor\(text, customers, industries\)/, "Ask AI answers from the page's own data")
assert.match(src, /onAnimationEnd=\{\(\) => setI/, "testimonials advance when their bar fills, so hover pauses them")
assert.match(src, /role="dialog" aria-modal="true" aria-labelledby="hcl-dlg-t"/, "book a demo is a modal dialog")
assert.match(src, /e\.key === "Tab" && box\.current/, "the dialog traps focus")
assert.match(src, /role="meter" aria-label="Margin"/, "the margin bar is a meter")
assert.match(src, /below\.forEach\(\(n\) => n\.classList\.add\("hcl-pre"\)\)/, "only content below the fold is hidden for reveal")
assert.match(src, /alive\.current = true\n/, "the unmount guard survives strict mode's double mount")
assert.ok(read("demo.tsx").includes("<HalyardCopilotLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-dusk.tsx"), /palette="dusk"/, "the second demo reprints the page")
assert.doesNotMatch(read("demo-dusk.tsx"), /="[^"]*\\n/, "no \\n inside a JSX string attribute (it would print literally)")

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic") +
  "\nexport { PALETTES, DEFAULT_THREADS, DEFAULT_GROUPS, DEFAULT_CUSTOMERS, DEFAULT_QUOTE, clamp, easeOutCubic, isEmail, initials, filterThreads, groupThreads, rewriteDraft, textToHtml, streamLength, formatMoney, formatCount, quoteTotals, allocate, trend, sparkPath, nextIndex, answerFor, tiltFor, resolvePalette, badgeParts }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

assert.equal(L.initials("Priya Raman"), "PR")
assert.equal(L.initials("Cher"), "C")
assert.equal(L.initials("  "), "?")

assert.ok(L.isEmail("p.raman@harborfloors.com"))
assert.ok(!L.isEmail("p.raman@harborfloors"))
assert.ok(!L.isEmail("p raman@harborfloors.com"))

const T = L.DEFAULT_THREADS
assert.equal(new Set(T.map((t) => t.id)).size, T.length, "thread ids are unique")
assert.ok(T.every((t) => t.recipients.every(L.isEmail)), "every default recipient is a real address")
assert.equal(L.filterThreads(T, "active", "").length, T.filter((t) => t.status === "active").length)
assert.deepEqual(L.filterThreads(T, "active", "harbor").map((t) => t.id), ["t1"], "search matches the account")
assert.deepEqual(L.filterThreads(T, "active", "THHN").map((t) => t.id), ["t4"], "and the title, case-insensitively")
assert.deepEqual(L.filterThreads(T, "resolved", "").map((t) => t.id), ["t8"])
const g = L.groupThreads(L.filterThreads(T, "active", ""), L.DEFAULT_GROUPS)
assert.deepEqual(g.map((x) => x.category), ["Proactive Outreach", "Pricing Requests", "Reorder Reminders"], "groups keep their order")
assert.equal(g[0].total, 323, "a group carries its full count")
assert.deepEqual(L.groupThreads([{ ...T[0], category: "Other" }], L.DEFAULT_GROUPS).map((x) => x.category), ["Other"], "unknown categories still group, empty ones drop")

const d = T[0].draft
const short = L.rewriteDraft(d, "Shorter")
assert.ok(short.length < d.length * 0.7, "shorter is shorter")
assert.ok(short.startsWith("Hi Priya,") && short.endsWith("Jackson"), "and keeps the greeting and sign-off")
const formal = L.rewriteDraft(d, "More formal")
assert.ok(formal.startsWith("Dear Priya,"))
assert.ok(formal.includes("Kind regards,\nJackson"))
assert.doesNotMatch(formal, /\bI'll\b/, "no contractions")
const warm = L.rewriteDraft(d, "Warmer")
assert.ok(warm.includes("Hope the week's treating you well!") && warm.includes("Talk soon,"))
assert.equal(L.rewriteDraft("one paragraph", "Shorter"), "one paragraph", "nothing to rewrite")
assert.equal(L.rewriteDraft(d, "Shorter"), short, "deterministic")

assert.equal(L.textToHtml("Hi <b>,\n\nLine one\nline two"), "<p>Hi &lt;b&gt;,</p><p>Line one<br>line two</p>", "escaped, paragraphs and breaks")
assert.equal(L.streamLength("hello world", 0, 100), 0)
assert.equal(L.streamLength("hello world", 10000, 100), 11, "finishes")
const mid = L.streamLength("the quick brown fox jumps over", 100, 120)
assert.ok(mid <= 12 && mid > 0, "streams at the given rate")

assert.equal(L.formatMoney(17406.4), "$17,406.40")
assert.equal(L.formatMoney(-2373.6), "-$2,373.60")
assert.equal(L.formatMoney(999.996), "$1,000.00", "rounding carries")
assert.equal(L.formatCount(1924), "1,924")
assert.equal(L.formatCount(4.6, 1), "4.6")

const q = L.quoteTotals([{ qty: 10, price: 100, cost: 70 }], 10)
assert.equal(q.subtotal, 1000)
assert.equal(q.off, 100)
assert.equal(q.ship, 185, "freight under the threshold")
assert.equal(q.total, 1085)
assert.ok(Math.abs(q.margin - (200 / 900) * 100) < 1e-9, "margin is on the discounted price")
assert.equal(L.quoteTotals([{ qty: 30, price: 100, cost: 70 }], 0).ship, 0, "free freight over the threshold")
assert.equal(L.quoteTotals([], 5).total, 0, "an empty quote is free")
assert.equal(L.quoteTotals([{ qty: 1, price: 10, cost: 5 }], 500).off, 10, "discount is clamped")

assert.deepEqual(L.allocate(40, [{ site: "Reno", qty: 36 }, { site: "Dayton", qty: 412 }]), { picks: [{ site: "Dayton", qty: 40 }], short: 0 }, "the deepest shelf ships it")
assert.deepEqual(L.allocate(30, [{ site: "A", qty: 18 }, { site: "B", qty: 6 }]), { picks: [{ site: "A", qty: 18 }, { site: "B", qty: 6 }], short: 6 }, "split, with the rest back-ordered")

assert.equal(L.trend([10, 10, 10, 10, 10, 10]), 0)
assert.ok(L.trend(L.DEFAULT_CUSTOMERS[0].weekly) < -30, "Harbor is slipping")
assert.ok(L.trend(L.DEFAULT_CUSTOMERS[1].weekly) > 20, "Ferreira is growing")
assert.equal(L.trend([0, 0, 0, 5, 5, 5]), 100, "from nothing is +100%")
assert.equal(L.trend([3]), 0)
assert.ok(L.DEFAULT_CUSTOMERS.every((c) => Math.abs(L.trend(c.weekly)) < 90), "no default account shows a misleading jump")

const path = L.sparkPath([1, 2, 3], 120, 30)
assert.match(path, /^M0\.0 [\d.]+ L60\.0 [\d.]+ L120\.0 [\d.]+$/)
assert.equal(L.sparkPath([], 120, 30), "")

assert.equal(L.nextIndex(2, "ArrowDown", 3), 0)
assert.equal(L.nextIndex(0, "ArrowUp", 3), 2)
assert.equal(L.nextIndex(1, "End", 3), 2)
assert.equal(L.nextIndex(1, "x", 3), 1)

const inds = L.DEFAULT_QUOTE.industries
const a1 = L.answerFor("Which accounts are buying less?", L.DEFAULT_CUSTOMERS, inds)
assert.ok(a1.rows.length > 0 && a1.rows[0].label === "Harbor Floor Supply", "the steepest drop comes first")
assert.ok(a1.rows.every((r) => r.tone === "down"))
const a2 = L.answerFor("What's running low in stock?", L.DEFAULT_CUSTOMERS, inds)
assert.ok(a2.rows.length > 0, "something is thin against open quotes")
assert.ok(L.answerFor("who should I call first today?", L.DEFAULT_CUSTOMERS, inds).rows.length === 3)
assert.match(L.answerFor("tell me about Nordic", L.DEFAULT_CUSTOMERS, inds).text, /^Nordic Tile & Stone ordered/)
assert.match(L.answerFor("hello", L.DEFAULT_CUSTOMERS, inds).text, /^Across your 8 accounts/)
assert.match(L.answerFor("who is slipping", [{ account: "A", contact: "B C", rep: "R", lastOrder: "x", weekly: [5, 5, 5, 5, 5, 5] }], []).text, /Nobody is slipping/)

assert.equal(L.tiltFor(900, 900), 1, "below the fold it lies back")
assert.equal(L.tiltFor(0, 900), 0, "near the top it is flat")
assert.ok(L.tiltFor(500, 900) > 0 && L.tiltFor(500, 900) < 1)

assert.equal(L.resolvePalette("dusk").glow, L.PALETTES.dusk.glow)
assert.equal(L.resolvePalette("nope").glow, L.PALETTES.steel.glow, "unknown names fall back to steel")
assert.equal(L.resolvePalette({ accent: "#f00" }).accent, "#f00", "a partial palette overrides")
assert.equal(L.resolvePalette({ accent: "#f00" }).glow, L.PALETTES.steel.glow, "and falls back to steel")
for (const [name, p] of Object.entries(L.PALETTES)) assert.ok(p.sky.length === 4 && p.night.length === 4, `${name} has four sky stops for each scheme`)

assert.deepEqual(L.badgeParts("One place for data → drafts → follow-up"), ["One place for data", "drafts", "follow-up"])
assert.deepEqual(L.badgeParts("a -> b"), ["a", "b"])

console.log("halyard-copilot-landing: ok")
