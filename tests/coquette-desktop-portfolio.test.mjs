// Install-safety and window-manager logic checks for components/coquette-desktop-portfolio.
// Run: node tests/coquette-desktop-portfolio.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "coquette-desktop-portfolio"
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
assert.doesNotMatch(src, /@import|@font-face|<link\b|<img\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(src.replace(/https:\/\/(github|linkedin)\.com"/g, ""), /https?:\/\//, "no external URL beyond the placeholder profile links")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "pattern references are built from the instance id")
assert.ok(src.includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
assert.match(src, /later = React\.useCallback\(\(fn: \(\) => void, ms: number\) => window\.setTimeout\(fn, reduced \? 0 : ms\)/, "window phases never wait on an animation that reduced motion removed")

const css = src.match(/const CDP_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(",")) assert.match(s.trim(), /^\.cdp-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.cdp-svg\{[^}]*max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.cdp-root :where\(button\)\{/, "the button reset has no specificity to fight the chips")
assert.match(css[1], /--cdp-desk:color-mix\(in oklab,var\(--cdp-bg\) 93%,var\(--cdp-fg\)\)/, "the desktop colour comes from the theme tokens, so dark mode follows")

/* ---------- it behaves like a desktop ---------- */

assert.match(src, /onDoubleClick=\{\(e\) => openIcon\(ic\.id, e\.currentTarget\)\}/, "icons open on double click")
assert.match(src, /if \(ev\.pointerType === "touch"\) openIcon\(id, el\)/, "a tap opens on touch")
assert.match(src, /e\.key === "Enter" \|\| e\.key === " "/, "icons open from the keyboard")
assert.match(src, /\(e\.metaKey \|\| e\.ctrlKey\) && e\.key\.toLowerCase\(\) === "k"/, "⌘/Ctrl+K opens Spotlight")
assert.match(src, /role="dialog"\n\s+aria-label=\{title\}/, "every window is a labelled dialog")
for (const l of ["Close", "Minimize", "Zoom"]) assert.ok(src.includes(`aria-label="${l}"`), `${l} light is labelled`)
assert.match(src, /if \(id\.startsWith\("music-"\)\) music\.stop\(\)/, "closing the music box stops the sound")
assert.match(src, /onLoad\.current\(\)/, "openOnLoad survives the first resize")
assert.ok(read("demo.tsx").includes("<CoquetteDesktopPortfolio />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- logic, executed ---------- */

const code = region("logic") + "\nexport { clamp, hashString, slugify, normalizeFolders, filterProjects, placeWindow, clampWindow, dockScale, mailtoHref, monthGrid, compactSpot, answerFor, DOCK_RESERVE }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

assert.equal(L.slugify("  Bow & Co. "), "bow-co")
assert.equal(L.slugify("!!!"), "item")
assert.ok(L.hashString("Todo List") >= 0 && L.hashString("x") !== L.hashString("y"), "hash is unsigned and spreads")

const F = L.normalizeFolders([
  { id: "a", label: "a", x: 0, y: 0, projects: [{ name: "Same" }, { name: "Same" }, { name: "Other", id: "o" }] },
  { id: "b", label: "b", title: "B!", style: "noir", x: 0, y: 0, projects: [{ name: "Same" }] },
])
assert.deepEqual(F[0].projects.map((p) => p.id), ["same", "same-2", "o"], "duplicate names get unique ids")
assert.equal(F[0].title, "a", "title falls back to the label")
assert.equal(F[0].style, "blush", "style defaults to blush")
assert.equal(F[1].projects[0].id, "same", "ids are per folder")
assert.equal(F[1].projects[0].folderId, "b")

const P = [
  { id: "1", folderId: "a", name: "Todo", tags: ["React"], description: "tasks" },
  { id: "2", folderId: "a", name: "Shop", tags: ["Next.js"], role: "Full stack" },
  { id: "3", folderId: "b", name: "Blog", tags: ["React", "Design"] },
]
assert.deepEqual(L.filterProjects(P, "", null).length, 3)
assert.deepEqual(L.filterProjects(P, "react", null).map((p) => p.id), ["1", "3"], "search reaches tags")
assert.deepEqual(L.filterProjects(P, "FULL", null).map((p) => p.id), ["2"], "search reaches role, case-insensitive")
assert.deepEqual(L.filterProjects(P, "", "Design").map((p) => p.id), ["3"], "tag filter")
assert.deepEqual(L.filterProjects(P, "todo", "Design"), [], "tag and search combine")

for (const [desk, compact] of [[{ w: 1440, h: 900 }, false], [{ w: 800, h: 500 }, false], [{ w: 390, h: 800 }, true], [{ w: 320, h: 300 }, true]]) {
  for (let n = 0; n < 8; n++) {
    const g = L.placeWindow(desk, { w: 600, h: 380 }, n, compact)
    assert.ok(g.x >= 0 && g.y >= 0, `window on screen at ${desk.w}x${desk.h} #${n}`)
    assert.ok(g.x + g.w <= desk.w, `window fits width at ${desk.w}x${desk.h} #${n}`)
    if (desk.h > 400) assert.ok(g.y + g.h <= desk.h - L.DOCK_RESERVE, `window clears the dock at ${desk.w}x${desk.h} #${n}`)
  }
}
const a = L.placeWindow({ w: 1440, h: 900 }, { w: 600, h: 380 }, 0, false)
const b = L.placeWindow({ w: 1440, h: 900 }, { w: 600, h: 380 }, 1, false)
assert.ok(b.x > a.x && b.y > a.y, "new windows cascade")

const c = L.clampWindow(-5000, -50, 400, { w: 1000, h: 700 })
assert.equal(c.x, 80 - 400, "80px of the title bar stays on screen at the left")
assert.equal(c.y, 0, "title bar never goes above the desktop")
assert.equal(L.clampWindow(5000, 5000, 400, { w: 1000, h: 700 }).x, 920)
assert.equal(L.clampWindow(5000, 5000, 400, { w: 1000, h: 700 }).y, 700 - L.DOCK_RESERVE - 28, "title bar never hides under the dock")

assert.equal(L.dockScale(null, 100), 1, "dock rests at 1")
assert.equal(L.dockScale(100, 100), 1.5, "peak under the pointer")
assert.equal(L.dockScale(300, 100), 1, "no effect out of reach")
assert.ok(L.dockScale(140, 100) > L.dockScale(180, 100), "falls off with distance")

assert.equal(L.mailtoHref("a@b.co", "", ""), "mailto:a@b.co")
assert.equal(L.mailtoHref("a@b.co", "Hi & bye", "line\nnext"), "mailto:a@b.co?subject=Hi%20%26%20bye&body=line%0Anext")

const sep = L.monthGrid(2026, 8) // September 2026 starts on a Tuesday
assert.deepEqual(sep[0], [null, 1, 2, 3, 4, 5, 6])
assert.equal(sep.flat().filter(Boolean).length, 30)
assert.ok(sep.every((w) => w.length === 7))
assert.equal(L.monthGrid(2024, 1).flat().filter(Boolean).length, 29, "leap February")

const spots = [0, 1, 2, 3, 4, 5].map(L.compactSpot)
assert.equal(new Set(spots.map((s) => s.x + "," + s.y)).size, 6, "compact spots never overlap")
assert.ok(spots.every((s) => s.y < 45), "compact icons stay above the headline")

const faq = [{ q: "Are you available?", a: "yes" }, { q: "What stack?", a: "React" }]
assert.equal(L.answerFor("are you AVAILABLE next month", faq, "?"), "yes")
assert.equal(L.answerFor("which stack do you use", faq, "?"), "React")
assert.equal(L.answerFor("zz", faq, "fallback"), "fallback")

console.log("coquette-desktop-portfolio: ok")
