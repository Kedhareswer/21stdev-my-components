// Install-safety, silk physics and leg IK checks for silk-spider-cursor.
// Run: node tests/silk-spider-cursor.test.mjs
//
// The silk engine and the IK solver live in the .tsx (one published file), so
// the marked regions are lifted out and type-stripped rather than duplicated.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/silk-spider-cursor/", import.meta.url)
const src = readFileSync(new URL("silk-spider-cursor.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports.sort(), [
  "react",
  "three",
  "three/examples/jsm/environments/RoomEnvironment.js",
  "three/examples/jsm/libs/meshopt_decoder.module.js",
  "three/examples/jsm/loaders/GLTFLoader.js",
])
assert.ok(pkg.dependencies.three, "three is declared in the root package.json")
assert.ok(tsconfig.includes('"@/components/ui/silk-spider-cursor"'), "tsconfig paths line exists")
assert.match(demo, /from "@\/components\/ui\/silk-spider-cursor"/, "demo imports the installed path")

assert.doesNotMatch(src + demo, /@import/, "no @import")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.match(src, /height: position === "fixed" \? "100svh"/, "the fixed overlay has a definite height")
assert.match(src, /prefers-reduced-motion/, "honours reduced motion")
assert.match(src, /maxWidth: "none"/, "canvases override Preflight max-width")
assert.match(src, /pointerEvents: "none"/, "never blocks the page underneath")

// The 21st CLI tokenizer hangs on TS generics before the first JSX close tag.
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback)</, "no hook generics")
assert.doesNotMatch(src, /new Map</, "no Map generics")

// ---- self-contained, and small enough to publish ---------------------------
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
assert.deepEqual(urls, [], "no network requests: " + urls.join(", "))
for (const k of ["DEFAULT_MODEL", "DEFAULT_TOP", "DEFAULT_FACE"]) {
  assert.match(src, new RegExp(`const ${k} = "data:(model/gltf-binary|image/webp);base64,[A-Za-z0-9+/=]+"`), `${k} is embedded`)
}
for (const k of ["MUG", "TEE", "STICKER"]) assert.match(demo, new RegExp(`const ${k} = "data:image/webp;base64,`), `${k} is embedded`)
// 21st rejects a file over 200,000 bytes with HTTP 413
assert.ok(Buffer.byteLength(src) < 200_000, `component is ${Buffer.byteLength(src)} bytes`)
assert.ok(Buffer.byteLength(demo) < 200_000, `demo is ${Buffer.byteLength(demo)} bytes`)

// ---- behaviour wiring ------------------------------------------------------
assert.match(src, /anchorSelector = "\[data-silk-anchor\]"/, "anchors are opt-in by attribute")
assert.ok((demo.match(/data-silk-anchor/g) ?? []).length >= 10, "the demo marks its elements")
assert.match(src, /clearKeys = \["Delete", "Backspace"\]/, "DEL and Backspace clear")
assert.match(src, /isTyping\(document\.activeElement\)/, "never clears while typing in a field")
assert.match(src, /visibilitychange/, "pauses while hidden")
assert.match(src, /Math\.min\(maxDpr, window\.devicePixelRatio/, "caps DPR")
assert.equal((src.match(/requestAnimationFrame\(frame\)/g) ?? []).length, 2, "one rAF loop (start + reschedule)")
assert.match(src, /const GROUP = \[0, 1, 0, 1, 1, 0, 1, 0\]/, "gait groups are L1 R2 L3 R4 / R1 L2 R3 L4")
assert.match(src, /getBoundingClientRect\(\)/, "anchors follow live element boxes")

// ---- leg IK ----------------------------------------------------------------
const region = (name) => {
  const a = src.indexOf(`// #region ${name}`)
  const b = src.indexOf("// #endregion", a)
  assert.ok(a > -1 && b > a, `${name} region markers missing`)
  return stripTypeScriptTypes(src.slice(a, b))
}
const { solveKnee } = await import("data:text/javascript," + encodeURIComponent(region("ik") + "\nexport { solveKnee }"))
const out = []
const dist = (ax, ay, az, bx, by, bz) => Math.hypot(ax - bx, ay - by, az - bz)
// a foot in reach: both bones keep their length, the knee bends toward the pole
solveKnee(0, 0, 1, 2, 0, 0, 1.5, 1.5, 0, 0, 1, out)
assert.ok(Math.abs(dist(0, 0, 1, out[0], out[1], out[2]) - 1.5) < 1e-6, "upper bone length kept")
assert.ok(Math.abs(dist(out[0], out[1], out[2], out[3], out[4], out[5]) - 1.5) < 1e-6, "lower bone length kept")
assert.ok(Math.abs(out[3] - 2) < 1e-6 && Math.abs(out[5]) < 1e-6, "foot lands on target")
assert.ok(out[2] > 1, "knee rises toward an up pole")
// the pole decides the bend: flip it and the knee flips
solveKnee(0, 0, 0, 2, 0, 0, 1.5, 1.5, 0, 1, 0, out)
assert.ok(out[1] > 0.5, "knee follows a sideways pole")
// out of reach: the leg straightens toward the target instead of breaking
solveKnee(0, 0, 0, 10, 0, 0, 1, 1, 0, 0, 1, out)
assert.ok(Math.abs(out[3] - 2) < 0.01, "an unreachable foot stops at full reach")

// ---- silk ------------------------------------------------------------------
const { createSilk, stepSilk } = await import("data:text/javascript," + encodeURIComponent(region("silk") + "\nexport { createSilk, stepSilk }"))
const s = createSilk()
const pin = (x, y) => s.particle(x, y, s.addAnchor({ el: null, u: 0, v: 0, sx: x, sy: y }))
const a = pin(100, 100), b = pin(400, 100)
const t = s.newThread(null)
s.span(t, a, b, 15, 0.05)
t.owned.push(a, b)
for (let i = 0; i < 600; i++) stepSilk(s, 1 / 120, i / 120, new Map(), 4)
const mid = t.parts[Math.floor(t.parts.length / 2)]
assert.ok(s.Y[mid] > 105, `a slack line sags under gravity (mid y ${s.Y[mid].toFixed(1)})`)
assert.ok(s.Y[mid] < 160, "but silk holds it: no runaway stretch")
assert.equal(s.X[a], 100, "pins stay on their anchor")
// anchors follow their element's live box
const el = {}
const rect = { left: 50, top: 60, width: 200, height: 100 }
const p = s.particle(0, 0, s.addAnchor({ el, u: 0.5, v: 0.5, sx: 0, sy: 0 }))
stepSilk(s, 1 / 120, 0, new Map([[el, rect]]), 1)
assert.deepEqual([s.X[p], s.Y[p]], [150, 110], "pinned to the centre of the box")
stepSilk(s, 1 / 120, 0, new Map([[el, { ...rect, top: -200 }]]), 1)
assert.equal(s.Y[p], -150, "moves with the element when the page scrolls")
// freeing a thread gives its particles back
const before = s.threads.length
s.freeThread(t)
assert.equal(t.parts.length, 0, "freed thread is empty")
assert.equal(s.threads.length, before, "freeThread leaves list bookkeeping to the caller")

console.log("silk-spider-cursor: all checks passed")
