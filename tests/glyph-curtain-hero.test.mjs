// Install-safety and behaviour check for components/glyph-curtain-hero.
// Run: node tests/glyph-curtain-hero.test.mjs
import assert from "node:assert/strict"
import { readFileSync, statSync } from "node:fs"

const src = readFileSync(new URL("../components/glyph-curtain-hero/glyph-curtain-hero.tsx", import.meta.url), "utf8")
const demo = readFileSync(new URL("../components/glyph-curtain-hero/demo.tsx", import.meta.url), "utf8")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
assert.match(src, /height = "100svh"/, "section height defaults to a definite length")
assert.ok(src.includes("style={{ minHeight: height }}"), "the section carries the height prop as its minimum")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /`/, "no backticks in the file")
assert.doesNotMatch(src, /\$\{/, "no ${ in the file")
assert.doesNotMatch(src, /useRef</, "no useRef generics")
assert.doesNotMatch(src, /(^|[{}"])\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.ok(Buffer.byteLength(src) < 200 * 1024, "21st rejects component files over 200 kB")
assert.match(demo, /from "@\/components\/ui\/glyph-curtain-hero"/, "demo imports the installed path")
assert.ok(tsconfig.includes('"@/components/ui/glyph-curtain-hero"'), "tsconfig needs its paths line")
const imports = src.match(/^import .* from "([^"]+)"/gm) || []
assert.deepEqual(imports.map((l) => l.replace(/.*from "/, "").replace(/"$/, "")), ["react"], "React is the only import")
assert.ok(src.includes(".gch-root img{max-width:none}") && src.includes('maxWidth: "none"'), "Preflight guard on the roofs")
assert.doesNotMatch(src, /scale\(/, "nothing is enlarged with transform: scale")
assert.ok(!/var\(--color-/.test(src), "assumes no theme tokens: the paper palette is its own")
assert.ok(src.includes(":where(.dark) .gch-root{"), "has a dark paper")

// Roofs come from the catalog site and exist locally.
const roofs = [...src.matchAll(/IMG \+ "([a-z-]+\.webp)"/g)].map((m) => m[1])
assert.equal(roofs.length, 5, "five destinations")
for (const r of roofs) assert.ok(statSync(new URL("../dev/public/glyph-curtain-hero/" + r, import.meta.url)).size > 10000, r + " present")
assert.ok(src.includes('const IMG = "https://kedhar-components.pages.dev/glyph-curtain-hero/"'), "roofs from the catalog")
const hosts = new Set((src.match(/https:\/\/[a-z0-9.-]+/gi) || []).map((u) => u.toLowerCase()))
for (const h of hosts) assert.ok(["https://kedhar-components.pages.dev", "https://fonts.googleapis.com"].includes(h), "unexpected host " + h)
for (const banned of [/budarina/i, /instagram/i, /destined meeting/i, /refuse gravity/i, /golden courtyards/i]) assert.doesNotMatch(src, banned, "no reference identifiers or copy: " + banned)

// Behaviour wiring.
assert.ok(src.includes('aria-label={"Previous: " + prev.name}') && src.includes('aria-label={"Next: " + next.name}'), "labelled prev/next cards")
assert.ok(src.includes('e.key === "ArrowRight"') && src.includes('e.key === "ArrowLeft"'), "arrow keys change destination")
assert.ok(src.includes('"(prefers-reduced-motion: reduce)"') && src.includes("@media (prefers-reduced-motion:reduce)"), "honours reduced motion")
assert.ok(src.includes(".gch-root[data-in=false] .gch-w{opacity:0;filter:blur(10px)"), "words blur out and back in")
assert.ok(src.includes("transitionDelay: 60 + n++ * 120"), "headline words stagger in")
assert.ok(src.includes("const now = performance.now()"), "one clock for the slide and the physics")
assert.ok(src.includes("st.ox[i] + (st.x[i] - s.lastDx - st.ox[i]) * alpha + s.offset"), "drawn frames blend physics steps and pin to the live roof")
assert.ok(src.includes("new IntersectionObserver"), "pauses off screen")
const T = Object.fromEntries([...src.matchAll(/^const (EXIT_MS|SWAP_MS|TEXT_MS|ENTER_AT|ENTER_MS) = (\d+)/gm)].map((m) => [m[1], +m[2]]))
assert.ok(T.EXIT_MS < T.SWAP_MS && T.SWAP_MS <= T.TEXT_MS && T.TEXT_MS < T.ENTER_AT, "exit, swap, new text, then the new roof: never overlapping")

// --- the strings, executed ------------------------------------------------
const a = src.indexOf("// #region physics")
const b = src.indexOf("// #endregion physics")
assert.ok(a > 0 && b > a, "physics region present")
const body = src
  .slice(a, b)
  .replace(/export interface \w+ \{[\s\S]*?\r?\n\}\r?\n/g, "")
  .replace(/export /g, "")
  .replace(/: (Strand|Pointer|number|string|boolean)(\[\])?/g, "")
const { makeStrands, stepStrands, layoutStrand } = new Function(body + "\nreturn { makeStrands, stepStrands, layoutStrand }")()

const seg = 13
const fresh = () => makeStrands(20, 40, 0, 300, 100, seg, "山高水长 春风")
const off = { x: 0, y: 0, r: 0, on: false }
const linkErr = (S) => Math.max(...S.flatMap((s) => [...s.x].slice(1).map((_, i) => Math.abs(Math.hypot(s.x[i + 1] - s.x[i], s.y[i + 1] - s.y[i]) - seg))))

// hangs straight and still
let S = fresh()
for (let k = 0; k < 120; k++) stepStrands(S, 0, k / 60, 0, off, true)
for (const s of S) for (let i = 0; i < 40; i++) assert.ok(Math.abs(s.x[i] - s.ax) < 0.01 && Math.abs(s.y[i] - (100 + i * seg)) < 0.01, "rests straight")
assert.equal(S[3].chars.filter((c) => c === " ").length > 0, true, "spaces leave gaps")

// the pointer is a round collider: nothing stays inside it, links keep their length
S = fresh()
const p = { x: 150, y: 350, r: 34, on: true }
for (let k = 0; k < 90; k++) stepStrands(S, 0, k / 60, 0, p, true)
let inside = 0
for (const s of S) for (let i = 1; i < 40; i++) if (Math.hypot(s.x[i] - p.x, s.y[i] - p.y) < p.r - 0.5) inside++
assert.equal(inside, 0, "strings wrap around the pointer")
assert.ok(linkErr(S) < 0.5, "links never stretch: " + linkErr(S))
assert.ok(Math.max(...S.map((s) => s.y[39])) <= 100 + 39 * seg + 0.01, "a string never hangs past its rest length")

// released, it drifts home in about a second, with no wild swing
p.on = false
let peak = 0
const trace = []
for (let k = 0; k < 120; k++) {
  stepStrands(S, 0, k / 60, 0, p, true)
  const m = Math.max(...S.map((s) => Math.max(...[...s.u].map(Math.abs))))
  trace.push(m)
  peak = Math.max(peak, m)
}
assert.ok(trace[6] > 4, "not snapped straight within 0.1 s: " + trace[6].toFixed(1))
assert.ok(trace[119] < 3, "home within 2 s: " + trace[119].toFixed(1))
assert.ok(peak <= p.r * 1.6, "never thrown past where it was pushed: " + peak.toFixed(1))

// the roof's slide leans the strings back a little and they settle
S = fresh()
for (const s of S) for (let i = 0; i < 40; i++) s.x[i] = s.ax + 1000
let lean = 0
for (let k = 0; k < 34 + 90; k++) {
  const e = Math.min(1, k / 34)
  stepStrands(S, 1000 * Math.pow(1 - e, 3), k / 60, 0, off, true)
  lean = Math.max(lean, Math.abs(S[5].u[39]))
}
assert.ok(lean > 15 && lean < 90, "a visible but gentle trail: " + lean.toFixed(1))
assert.ok(Math.abs(S[5].u[39]) < 8, "settled 1.5 s after landing: " + S[5].u[39].toFixed(1))

// layout keeps arc length as a string bends
const one = makeStrands(1, 10, 0, 0, 0, 10, "a")[0]
for (let i = 1; i < 10; i++) one.u[i] = i * 4
layoutStrand(one, 0)
for (let i = 1; i < 10; i++) assert.ok(Math.abs(Math.hypot(one.x[i] - one.x[i - 1], one.y[i] - one.y[i - 1]) - 10) < 1e-3, "arc length kept")

console.log("glyph-curtain-hero: all checks passed")
