// Install-safety, scoped-CSS and geometry checks for crab-perch-buttons.
// Run: node tests/crab-perch-buttons.test.mjs

import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/crab-perch-buttons/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("crab-perch-buttons.tsx")

// ---- 1. Install safety -----------------------------------------------------
assert.deepEqual(
  readdirSync(dir).sort(),
  ["README.md", "crab-perch-buttons.tsx", "demo-playground.tsx", "demo.tsx"],
  "the folder ships the component, its demos and a README, nothing else",
)
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /https?:\/\/(?!www\.w3\.org)/, "no external URLs: the crab is drawn, not fetched")
assert.doesNotMatch(src, /<img|new Image\(|url\(["']?http/, "no image assets")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="switch"') && src.includes("aria-checked={on}"), "the toggle is a switch")
assert.ok(src.includes('role="listbox"') && src.includes('aria-haspopup="listbox"') && src.includes("aria-activedescendant"), "the dropdown is a listbox")
assert.ok(src.includes('aria-hidden="true"'), "the crab is decorative")
assert.ok(src.includes("cancelAnimationFrame(a.raf)"), "the walk loop is torn down")
assert.ok(src.includes("ro?.disconnect()"), "the resize observer is torn down")
assert.ok(src.includes('removeEventListener("pointerdown", away)'), "the outside-click listener is torn down")
assert.ok(src.includes("export default CrabButton"), "CrabButton is the default export")
for (const name of ["CrabButton", "CrabToggle", "CrabDropdown", "CrabMascot"]) assert.match(src, new RegExp("export (const|function) " + name + "\\b"), name + " is exported")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "no generic hook type arguments (the 21st CLI tokenizer hangs on them)")
const generic = src.slice(0, src.indexOf("</")).match(/Partial<|Record<|ReturnType<|React\.[A-Za-z]+</)
assert.equal(generic, null, "no generics before the first JSX close tag: " + (generic && generic[0]))

// ---- 2. Scoped CSS ---------------------------------------------------------
const css = src.match(/const CPB_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.match(css, /\.cpb-plane \{[^}]*max-width: none/, "the crab planes override Preflight's max-width")
for (const part of ["cpb-eyes", "cpb-arm", "cpb-hand", "cpb-finger", "cpb-legs-l"]) assert.ok(css.includes("." + part), part + " is its own animated plane")
assert.ok(src.includes("<feTurbulence") && src.includes("<feSpecularLighting") && src.includes("<feDiffuseLighting"), "the crab is lit by the relief filter")
let rules = 0
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.,\s%]+$)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".cpb-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 40, `expected a full scoped sheet, saw ${rules} rules`)
for (const k of css.matchAll(/@keyframes ([\w-]+)/g)) assert.ok(k[1].startsWith("cpb-"), "unprefixed keyframes: " + k[1])
for (const mood of ["hover", "press", "sleep"]) assert.ok(css.includes(`[data-live="${mood}"]`), `mood ${mood} is styled`)

// ---- 3. Helpers, executed --------------------------------------------------
const a = src.indexOf("// #region crab")
const b = src.indexOf("// #endregion")
assert.ok(a > -1 && b > a, "crab region missing")
const C = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

// colour
assert.deepEqual(C.cpbRgb("#fff"), [255, 255, 255])
assert.deepEqual(C.cpbRgb("e4562c"), [228, 86, 44])
assert.deepEqual(C.cpbRgb("nonsense"), [128, 128, 128], "unreadable colours fall back to grey")
assert.equal(C.cpbHex([300, -5, 16.4]), "#ff0010", "channels clamp and round")
assert.equal(C.cpbMix("#000000", "#ffffff", 0.5), "#808080")
assert.equal(C.cpbShade("#336699", 0), "#336699")
assert.equal(C.cpbShade("#336699", 1), "#ffffff")
assert.equal(C.cpbShade("#336699", -1), "#000000")
assert.ok(C.cpbLuma("#ffffff") > 0.99 && C.cpbLuma("#000000") < 0.01)
assert.equal(C.cpbPick(C.CPB_CRABS, "blue", "red"), C.CPB_CRABS.blue, "presets by name")
assert.equal(C.cpbPick(C.CPB_CRABS, "ff00aa", "red"), "#ff00aa", "hex without #")
assert.equal(C.cpbPick(C.CPB_CRABS, "#abc", "red"), "#abc", "short hex")
assert.equal(C.cpbPick(C.CPB_CRABS, "chartreuse-ish", "red"), C.CPB_CRABS.red, "junk falls back")
assert.equal(C.cpbPick(C.CPB_CRABS, "toString", "red"), C.CPB_CRABS.red, "no prototype leaks")
for (const shell of Object.values(C.CPB_CRABS)) {
  const t = C.cpbCrabTones(shell)
  assert.ok(C.cpbLuma(t.hi) > C.cpbLuma(t.base) && C.cpbLuma(t.base) > C.cpbLuma(t.dark) && C.cpbLuma(t.dark) > C.cpbLuma(t.deep), "shell shades are ordered for " + shell)
  assert.ok(C.cpbLuma(t.nail) < C.cpbLuma(t.dark), "leg and claw tips are the darkest shade for " + shell)
  assert.ok(C.cpbLuma(t.cream) > C.cpbLuma(t.base) && C.cpbLuma(t.face) > C.cpbLuma(t.base), "the face and palm undersides are paler than the shell for " + shell)
}
// label contrast on every preset tone (WCAG AA, large text 3:1)
const contrast = (x, y) => {
  const [hi, lo] = [C.cpbLuma(x), C.cpbLuma(y)].sort((p, q) => q - p)
  return (hi + 0.05) / (lo + 0.05)
}
for (const [name, tone] of Object.entries(C.CPB_TONES)) {
  const f = C.cpbFace(tone)
  assert.ok(contrast(f.ink, tone) >= 4.5, `label contrast on ${name}: ${contrast(f.ink, tone).toFixed(2)}`)
}
assert.equal(C.cpbFace("#566341", "#ff0000").ink, "#ff0000", "an explicit ink wins")

// walking range
assert.deepEqual(C.cpbRange(100, 400), [50, 50], "a crab wider than the button stays centred")
const [lo, hi] = C.cpbRange(300, 160)
assert.ok(lo > 0 && hi < 300 && lo < hi && Math.abs(lo + hi - 300) < 1e-9, "the range is symmetric inside the button")
assert.equal(C.cpbClamp(5, 0, 3), 3)
assert.equal(C.cpbClamp(-5, 0, 3), 0)

// paths
const sq = "M0 0L10 0L10 10L0 10Z"
assert.equal(C.cpbMirror(C.cpbMirror(sq)), sq, "mirroring twice is the identity")
assert.equal(C.cpbMirror("M10 5"), "M" + (C.CPB_W - 10) + " 5")
assert.equal(C.cpbPlace("M1 0", 0, 0, 90), "M0 1", "rotation is clockwise in screen space")
assert.equal(C.cpbPlace("M1 2C3 4 5 6 7 8", 10, 20, 0), "M11 22C13 24 15 26 17 28", "every pair moves")
const shell = C.cpbCarapace()
assert.match(shell, /^M[\d.\s-]+(C[\d.\s-]+)+Z$/, "the carapace is one closed smooth path")
const front = C.cpbFront()
assert.match(front, /^M.*Z$/, "the face is one closed path")
const leg = C.cpbLeg([[0, 0], [10, -10], [20, 0], [22, 20]], [10, 9, 7, 0])
assert.ok(/^M.*Z$/.test(leg.body) && /^M.*Z$/.test(leg.nail), "a leg has a body and a dark tip")
const teeth = C.cpbSerrate([[0, 0], [60, 0]], 4, 3)
assert.equal(teeth.length, 25)
assert.ok(Math.max(...teeth.map((p) => Math.abs(p[1]))) <= 3 + 1e-9 && Math.min(...teeth.map((p) => p[1])) < -2.9, "teeth stand out by amp on one side")
assert.deepEqual(C.cpbAlong([[0, 0], [10, 0], [10, 10]], 0.75).p, [10, 5], "along walks by length")
assert.deepEqual(C.cpbPoint(1, 0, 5, 5, 90, 2).map((v) => +v.toFixed(6)), [5, 7], "points scale, turn and move like paths")
const nums = shell.match(/-?\d+(\.\d+)?/g).map(Number)
const xs = nums.filter((_, i) => i % 2 === 0)
const ys = nums.filter((_, i) => i % 2 === 1)
assert.ok(Math.min(...xs) > 0 && Math.max(...xs) < C.CPB_W, "the shell fits the drawing's width")
assert.ok(Math.min(...ys) > 20 && Math.max(...ys) <= C.CPB_EDGE + 6, "the shell sits on the edge, not through the button")
const limb = C.cpbLimb([[0, 0], [10, 0], [20, 0]], [4, 4, 0])
assert.match(limb, /^M.*Z$/, "a limb is a closed path")
assert.ok(![limb, shell, front, leg.body, leg.nail].some((d) => /NaN/.test(d)), "no NaN in the geometry")

// ---- 4. Demos --------------------------------------------------------------
for (const f of ["demo.tsx", "demo-playground.tsx"]) {
  const d = read(f)
  assert.match(d, /from "@\/components\/ui\/crab-perch-buttons"/, f + " imports the installed path")
  assert.match(d, /export default function Demo/, f + " default-exports a Demo")
  assert.doesNotMatch(d, /\bh-full\b/, f + " has no h-full")
}

console.log("crab-perch-buttons: ok")
