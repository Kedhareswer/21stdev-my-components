// Runnable check for components/synapse-folio-template: the crew's choreography maths, the content rules and the
// install-safety rules.
// Run: node tests/synapse-folio-template.test.mjs
//
// What breaks silently here: a CSS selector that leaks out of .sy-root, an element reset that outranks a component
// class, a picture the component asks for that was never put in dev/public, a cut-out that picked up a neighbour's
// pixels, a debug handle left on the hero, or copy that names the reference.
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "synapse-folio-template"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const readme = readFileSync(new URL("README.md", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap"], "react and gsap are the only imports")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.gsap, "gsap is declared in the root package.json")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 200_000, "under 21st's 200 kB component limit: " + statSync(file).size)
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
const tpl = JSON.parse(readFileSync(new URL("../scripts/templates.json", import.meta.url), "utf8"))
assert.equal(tpl.templates.filter((t) => t.slug === slug).length, 1, "listed once in scripts/templates.json")

assert.match(demo, /from "@\/components\/ui\/synapse-folio-template"/, "demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /className="sy-hero" style=\{\{ minHeight: height \}\}/, "the hero takes the height prop")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /__tl|console\.log|debugger/, "no debug handles left in")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
assert.deepEqual([...new Set(urls)], ["https://kedhar-components.pages.dev/synapse-folio-template/"], "the only URL is the pictures' base; fonts are embedded")
assert.equal((src.match(/@font-face\{font-family:Sy(Serif|Mono)/g) || []).length, 3, "three embedded, renamed font subsets")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime and skips the build")

// every picture the component asks for exists locally (the dev server serves dev/public in place of the site)
const pics = [...new Set([...src.matchAll(/(?:img\(|base \+ |image: )"([a-z0-9-]+\.webp)"/g)].map((m) => m[1]))]
assert.ok(pics.length >= 8, "found the picture list: " + pics.join(", "))
for (const p of pics) assert.ok(existsSync(new URL("../dev/public/" + slug + "/" + p, import.meta.url)), "missing dev/public/" + slug + "/" + p)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt).replace(/"\s*\+\s*\n\s*(\/\/[^\n]*\n\s*)*"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{/, "hover effects only where a mouse can hover")
assert.match(css, /\.sy-root img\{max-width:none/, "guards Preflight's img max-width")
assert.match(css, /\.sy-root\{--bg:[^}]*width:100%;/, "the root claims the full width: 21st centres demos in a flex box")
assert.match(css, /:where\(\.dark\) \.sy-root\{--bg:/, "a dark palette for the ?dark check")
assert.match(css, /\.sy-root :where\(a,button\)\{/, "link/button reset is wrapped in :where()")
assert.doesNotMatch(css, /\.sy-root (a|button|h1|h2|p|ul|li)[,{]/, "no bare element resets")
assert.match(css, /\.sy-armbox \.sy-arm\{[^}]*background:var\(--bg\)/, "the arm is knocked out of its box (outranks .sy-mask's ink)")
let rules = 0
const body = css.replace(/^const CSS =\s*FONTS \+\s*"/, "").replace(/"\s*\+\s*(EASE|SERIF|MONO)\s*\+\s*"/g, "")
for (const m of body.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(/,(?![^(]*\))/).every((x) => /^(\.sy-|:where\(\.dark\) \.sy-)/.test(x.trim())), "unscoped selector: " + sel)
}
assert.ok(rules >= 120, "the scope check saw real rules, saw " + rules)

// ---- the crew -------------------------------------------------------------
const { travel, chooseHand, wordTime, exitPoint, crewSize, wander, snapCell, meridians } = await liftRegion(src, "choreography")
assert.ok(travel(0) > 0.2 && travel(0) < 0.3, "a hop still takes a moment")
assert.ok(travel(1200) < 1, "a long trip stays under a second")
assert.ok(travel(400) > travel(100), "longer trips take longer")
assert.equal(chooseHand([{ x: 0, y: 0, t: 0 }, { x: 500, y: 0, t: 0 }], { x: 480, y: 0 }, 0), 1, "the nearest free agent takes the job")
assert.equal(chooseHand([{ x: 0, y: 0, t: 5 }, { x: 900, y: 0, t: 0 }], { x: 10, y: 0 }, 0), 1, "a busy agent loses to a free one")
assert.ok(wordTime("I") < wordTime("intersection") && wordTime("x".repeat(40)) < 0.3, "word time grows with length, capped")
assert.deepEqual(exitPoint({ x: 10, y: 300 }, 1000, 800), { x: -70, y: 300 }, "leaves by the nearest edge")
assert.deepEqual(exitPoint({ x: 500, y: 790 }, 1000, 800), { x: 500, y: 870 })
assert.equal(crewSize(390, 4), 3, "fewer cursors on phones")
assert.equal(crewSize(1440, 4), 4)
const w = wander(7)
assert.deepEqual(wander(7), w, "wander is deterministic")
assert.ok(Math.abs(w.x) <= 24 && Math.abs(w.y) <= 17, "wander stays small")
assert.deepEqual(snapCell(65, 10, 30, 12, 10), { x: 60, y: 0 }, "snaps to the cell under the pointer")
assert.equal(snapCell(400, 10, 30, 12, 10), null, "nothing outside the grid")
assert.equal(snapCell(-1, 10, 30, 12, 10), null)
const m = meridians(0, 46, 4)
assert.equal(m.length, 4)
assert.ok(Math.abs(m[0] - 46) < 1e-9 && Math.abs(m[2]) < 1e-9, "meridians run from full width to edge-on")

// ---- the build -------------------------------------------------------------
assert.match(src, /tl\.eventCallback\("onComplete", finish\)/, "the build hands the page back when it ends")
assert.match(src, /ctx\?\.revert\(\)/, "finishing reverts every inline style the build set")
assert.match(src, /onResize = \(\) => tlRef\.current\?\.progress\(1\)/, "a resize mid-build finishes it rather than leaving stale positions")
assert.match(src, /key\(h, "(\\u2318|⌘)V"/, "objects are pasted with a shortcut chip")
assert.match(src, /data-on/, "picked-up objects show their selection frame and label")
assert.match(src, /phase === "intro" \? "Skip" : "Replay"/, "the nav button skips, then replays")
assert.match(src, /closest\("\[data-drag\]"\)/, "placed objects can be dragged")
assert.match(src, /setDots/, "the pattern toggle swaps the board paper")

// ---- cut-outs: one connected piece each, nothing from a neighbour ------------------
// (decoding webp needs no dependency here: alpha checks live in the cut script; we assert the files are sane)
for (const p of ["hand", "bust", "arm", "coral"]) {
  const f = new URL("../dev/public/" + slug + "/" + p + ".webp", import.meta.url)
  const b = readFileSync(f)
  assert.equal(b.toString("ascii", 0, 4), "RIFF", p + " is a webp")
  assert.ok(b.includes(Buffer.from("ALPH")) || b.includes(Buffer.from("VP8L")), p + " carries alpha")
}

// ---- copy ---------------------------------------------------------------------
assert.match(src, /email = "kedhareswer\.12110626@gmail\.com"/, "his own address")
assert.match(src, /Client 1[\s\S]*Client 2[\s\S]*Client 3/, "placeholder clients")
assert.match(src, /Project 01[\s\S]*Project 02[\s\S]*Project 03/, "placeholder projects")
assert.doesNotMatch(src + readme + demo, /sut[eé]ra|framer|clarisse|michard|pinterest|change reality|cybernetic/i, "nothing from the reference")
assert.match(readme, /## Props/, "README documents the props")

console.log("synapse-folio-template: ok")
