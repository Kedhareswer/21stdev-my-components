// Install-safety, frame-loop hygiene and voice-math checks for components/live-voice-room.
// Run: node tests/live-voice-room.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "live-voice-room"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments")
assert.ok(src.length < 100_000, "lean: " + src.length)
assert.ok(demo.length < 200_000, "demo under 200 KB: " + demo.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "").replace(/url\([^)]*\)/g, "url()")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel.startsWith("FONT") || /^(from|to|\d+%)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".lvr-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 50, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.lvr-av>img,\.lvr-av>\.lvr-ini\{[^}]*max-width:none/, "speaker photos override Preflight")
assert.match(flat, /\.lvr-faces>\*\{[^}]*max-width:none/, "listener faces override Preflight")
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(v.startsWith("--lvr-"), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")
assert.deepEqual([...demo.matchAll(/["'(]https?:\/\//g)], [], "demo is self-contained")

// ---- loop, a11y, motion ------------------------------------------------------------
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads anywhere")
assert.ok(src.includes('style.setProperty("--lvr-l"') && src.includes("cancelAnimationFrame(raf)"), "the loop writes one CSS variable per seat and is cleaned up")
assert.doesNotMatch(src, /getUserMedia/, "never touches the microphone")
assert.ok(src.includes('aria-pressed={!muted}') && src.includes('aria-label={muted ? "Unmute microphone" : "Mute microphone"}'), "mic toggle semantics")
assert.ok(src.includes('aria-label="Speakers"') && src.includes('", speaking"') && src.includes('", muted"'), "speaker state is spelled out")
assert.ok(src.includes('role="group" aria-label="Reactions"') && src.includes('e.key === "Escape"'), "reaction picker")
assert.ok(src.includes('aria-live="off"'), "captions don't flood screen readers")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "reduced motion honoured")
assert.ok(src.includes("if (reduced.matches) target = target > 0.05 ? 0.4 : 0"), "reduced motion holds a steady ring")

// ---- the lifted voice math -----------------------------------------------------------
const start = src.indexOf("// #region voice")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

let lo = 1
let hi = 0
for (let t = 0; t < 20; t += 0.013) {
  const v = L.speechLevel(t, 3)
  assert.ok(v >= 0 && v <= 1, "level in range: " + v)
  lo = Math.min(lo, v)
  hi = Math.max(hi, v)
}
assert.ok(hi > 0.7 && lo < 0.15, "speech swings between pauses and peaks: " + lo + ".." + hi)
const up = L.smoothLevel(0, 1, 0.016)
const down = 1 - L.smoothLevel(1, 0, 0.016)
assert.ok(up > down, "fast attack, slow release")
assert.ok(L.smoothLevel(0.5, 0.5, 0.016) === 0.5, "steady stays steady")
assert.equal(L.formatElapsed(65), "1:05")
assert.equal(L.formatElapsed(3725), "1:02:05")
assert.equal(L.compact(214), "214")
assert.equal(L.compact(1200), "1.2k")
assert.equal(L.compact(1000), "1k")
assert.equal(L.compact(25400), "25k")

console.log(slug + ": ok")
