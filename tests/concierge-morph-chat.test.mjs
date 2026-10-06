// Install-safety checks plus runnable checks on the morph math and the
// built-in concierge's replies.
// Run: node tests/concierge-morph-chat.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/concierge-morph-chat/", import.meta.url)
const src = readFileSync(new URL("concierge-morph-chat.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const demoOpen = readFileSync(new URL("demo-open.tsx", dir), "utf8")

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")

assert.doesNotMatch(src, /@import/, "no @import — the host project owns fonts and Tailwind")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full on any element")
assert.match(src, /prefers-reduced-motion/, "honours reduced motion")
// The 21st CLI's tokenizer goes exponential on hook generics ahead of JSX.
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback)</, "no generics on hooks")

const css = src.match(/const CMC_CSS = `([\s\S]*?)`\n/)
assert.ok(css, "CMC_CSS block is present")
assert.doesNotMatch(css[1], /\$\{|`/, "no backticks or interpolation inside the CSS string")

let ruleCount = 0
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  ruleCount++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".cmc-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(ruleCount >= 50, `expected the scope check to see real rules, saw ${ruleCount}`)

// The root's size comes from props with definite defaults, never a percentage.
assert.match(src, /height = "min\(680px, calc\(100svh - 48px\)\)"/, "definite default height")
const rootRule = css[1].match(/\.cmc-root \{([^}]*)\}/)
assert.doesNotMatch(rootRule[1], /height:\s*\d+%/, ".cmc-root must not take a percentage height")

// Preflight: every sized svg/img opts out of max-width: 100%.
for (const sel of [".cmc-portrait, .cmc-avatar-img", ".cmc-card-img", ".cmc-garment", ".cmc-knot"]) {
  const block = css[1].match(new RegExp(sel.replace(/[.,]/g, "\\$&") + "\\s*\\{([^}]*)\\}"))
  assert.ok(block, `${sel} rule missing`)
  assert.match(block[1], /max-width:\s*none/, `${sel} must guard against Preflight`)
}

// ---- the morph is transforms only -------------------------------------------
const paint = src.slice(src.indexOf("const paint = "), src.indexOf("React.useLayoutEffect"))
const written = [...paint.matchAll(/\.style\.(\w+)\s*=/g)].map((m) => m[1])
assert.deepEqual(
  [...new Set(written)].sort(),
  ["borderRadius", "opacity", "transform"],
  "the frame writes transform (plus the radius correction and stage opacity) and nothing else",
)
assert.doesNotMatch(paint, /style\.(width|height|left|top|right|bottom)\b/, "no layout properties animate")

// ---- behaviour, read off the source ----------------------------------------
assert.match(src, /aria-expanded=\{isOpen\}/, "launcher reports its state")
assert.match(src, /aria-controls=\{panelId\}/, "launcher names the panel")
assert.match(src, /e\.key !== "Escape"/, "Escape closes")
assert.match(src, /toggleAttribute\("inert", !isOpen\)/, "a closed panel is out of the tab order")
assert.doesNotMatch(src, /\binert=\{/, "inert must be set as an attribute, not a prop")

// ---- self-contained ----------------------------------------------------------
const shipped = src + demo + demoOpen
assert.doesNotMatch(shipped, /\bfigr\b/i, "must not reference the product this was studied from")
assert.doesNotMatch(shipped, /https?:\/\/(?!www\.w3\.org)/i, "no remote assets — nothing to 404 after install")
assert.match(demo, /from "@\/components\/ui\/concierge-morph-chat"/, "demo imports the installed path")
assert.match(demoOpen, /from "@\/components\/ui\/concierge-morph-chat"/, "demo-open imports the installed path")

// ---- logic region ------------------------------------------------------------
const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "logic region markers missing")
const js = src
  .slice(start, end)
  .replace(/:\s*(number|string|RegExp|ConciergeReply)(?=[,)\s{=])/g, "")
  .replace(/\] as const/g, "]")
const { morphFrame, stageAt, conciergeReply, LAUNCH, RADIUS, AV, AV_CLOSED, PAD_X, PAD_TOP } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`)
const W = 400
const H = 640

// Closed: the surface is exactly the launcher circle in the bottom-right corner.
const shut = morphFrame(0, W, H)
close(shut.sx * W, LAUNCH, "closed width is the launcher")
close(shut.sy * H, LAUNCH, "closed height is the launcher")
close(shut.rx * shut.sx, LAUNCH / 2, "closed corner reads as a circle (x)")
close(shut.ry * shut.sy, LAUNCH / 2, "closed corner reads as a circle (y)")
close(shut.ax + (AV * shut.as) / 2, W - LAUNCH / 2, "portrait centred in the launcher (x)")
close(shut.ay + (AV * shut.as) / 2, H - LAUNCH / 2, "portrait centred in the launcher (y)")
close(shut.as * AV, AV_CLOSED, "portrait at launcher size")

// Open: identity transform, panel radius, portrait in the header slot.
const full = morphFrame(1, W, H)
close(full.sx, 1, "open sx")
close(full.sy, 1, "open sy")
close(full.rx, RADIUS, "open radius x")
close(full.ry, RADIUS, "open radius y")
close(full.ax, PAD_X, "portrait lands at the header padding (x)")
close(full.ay, PAD_TOP, "portrait lands at the header padding (y)")
close(full.as, 1, "portrait at header size")

// In between, the visible corner stays round: rx*sx === ry*sy at every step.
for (let p = -0.05; p <= 1.08; p += 0.01) {
  const f = morphFrame(p, W, H)
  assert.ok(f.sx > 0 && f.sy > 0, `scale stays positive at p=${p}`)
  close(f.rx * f.sx, f.ry * f.sy, `corner stays circular at p=${p.toFixed(2)}`)
}
// Height trails width, so the corner sweeps on a curve.
const mid = morphFrame(0.5, W, H)
assert.ok(mid.sx * W - LAUNCH > (mid.sy * H - LAUNCH) * (W - LAUNCH) / (H - LAUNCH), "height trails width")

// Content arrives bottom-up and only once the surface is mostly out.
assert.equal(stageAt(0.3, 0), 0)
assert.equal(stageAt(1, 4), 1)
assert.ok(stageAt(0.7, 0) > stageAt(0.7, 4), "the footer arrives before the header")

// ---- built-in concierge ------------------------------------------------------
const r = (t) => conciergeReply(t)
assert.match(r("hello").text, /^Hi!/)
assert.match(r("What's new?").text, /arrived/i)
assert.ok(r("What's new?").products.length >= 2, "new arrivals come with products")
assert.match(r("Try on live").text, /camera/)
assert.match(r("A relaxed linen shirt for summer").text, /heat/)
const linen = r("A relaxed linen shirt for summer").products.map((p) => p.name)
assert.equal(new Set(linen).size, linen.length, "no duplicate products in one reply")
assert.ok(r("anything under $80").products.every((p) => parseInt(p.price.slice(1)) < 80), "under $80 means under $80")
assert.match(r("how does the sizing run?").text, /true to size/)
assert.match(r("returns?").text, /30 days/)
assert.match(r("can I talk to a person").text, /studio team/)
assert.match(r("qwerty").text, /tell me a little more/i, "unknown input gets a friendly nudge")
for (const t of ["hello", "Let me explore", "What's new?", "qwerty"]) {
  const s = r(t).suggestions
  assert.ok(Array.isArray(s) && s.length >= 2 && s.length <= 3, `suggestions for "${t}" fit the chip row`)
}

console.log("concierge-morph-chat: ok")
