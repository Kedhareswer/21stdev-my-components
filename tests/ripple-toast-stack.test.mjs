// Install-safety, store and stack-logic checks for components/ripple-toast-stack.
// Run: node tests/ripple-toast-stack.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "ripple-toast-stack"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments")
assert.ok(src.length < 80_000, "lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "").replace(/" \+ H \+ "/g, "68").replace(/url\([^)]*\)/g, "url()")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel.startsWith("FONT") || /^(from|to|\d+%)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().replace(/^:where\(\.dark\)\s+/, "").startsWith(".rts-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 50, "the scope check saw real rules, saw " + rules)
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(v.startsWith("--rts-"), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")
assert.deepEqual([...demo.matchAll(/["'(]https?:\/\//g)], [], "demo is self-contained")

// ---- a11y, motion, runtime hygiene --------------------------------------------------
assert.ok(src.includes('role={t.kind === "error" ? "alert" : "status"}'), "errors are alerts, the rest status")
assert.ok(src.includes('aria-label="Notifications"'), "labelled region")
assert.ok(src.includes('e.key === "Escape" || e.key === "Delete"'), "keyboard dismiss")
assert.ok(src.includes('aria-label={"Dismiss: " + t.title}'), "close buttons are labelled")
assert.match(flat, /\.rts-root\[data-paused=true\] \.rts-bar>i\{animation-play-state:paused\}/, "timers pause on hover/focus/hidden")
assert.ok(src.includes("visibilitychange"), "a hidden tab pauses")
assert.ok(src.includes("onAnimationEnd={() => leave"), "the progress bar is the timer: pausing it pauses dismissal")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "reduced motion honoured")
// The progress bar must keep running under reduced motion, or toasts would never leave.
const reduced = flat.slice(flat.indexOf("@media (prefers-reduced-motion:reduce)"))
assert.doesNotMatch(reduced, /rts-bar/, "reduced motion keeps the timer")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads anywhere, pointer handlers included")
assert.ok(src.includes("new ResizeObserver") && src.includes("ro.disconnect()"), "the width is cached by a ResizeObserver")
assert.ok(src.includes('setProperty("--rts-dx"'), "the drag writes a CSS variable only")

// ---- the lifted store and stack logic ------------------------------------------------
const start = src.indexOf("// #region store")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

let seen = []
const off = L.subscribe((l) => (seen = l))
const a = L.toast.success("Saved")
const b = L.toast.error("Nope", { description: "why" })
assert.deepEqual(seen.map((t) => t.id), [b, a], "newest first")
assert.equal(seen[0].kind, "error")
assert.equal(seen[0].description, "why")
L.toast.info("Replaced", { id: a })
assert.equal(seen.length, 2, "same id updates in place")
assert.equal(seen.find((t) => t.id === a).title, "Replaced")
assert.equal(L.toast.loading("Wait").length > 0, true)
assert.equal(seen[0].duration, 0, "loading never times out")
L.dismiss(b)
assert.ok(!seen.some((t) => t.id === b), "dismiss one")
await L.toast.promise(Promise.resolve(3), { loading: "…", success: (v) => "got " + v, error: "bad" })
await Promise.resolve()
assert.equal(seen[0].title, "got 3", "a promise toast turns into success in place")
assert.equal(seen[0].kind, "success")
await L.toast.promise(Promise.reject(new Error("x")), { loading: "…", success: "ok", error: (e) => "failed: " + e.message }).catch(() => {})
await Promise.resolve()
assert.equal(seen[0].title, "failed: x")
L.dismiss()
assert.equal(seen.length, 0, "dismiss all")
off()

assert.deepEqual(L.stackOffset(0, false, 68, 10), { y: 0, scale: 1, opacity: 1 })
assert.deepEqual(L.stackOffset(2, true, 68, 10), { y: 156, scale: 1, opacity: 1 }, "expanded lays out flat")
assert.equal(L.stackOffset(3, false, 68, 10).opacity, 0, "a fourth toast hides in the deck")
assert.ok(L.stackOffset(1, false, 68, 10).scale < 1, "back toasts shrink")
assert.equal(L.swipeDismisses(150, 400, 380), true, "past 30 %")
assert.equal(L.swipeDismisses(60, 400, 380), false, "a nudge snaps back")
assert.equal(L.swipeDismisses(-60, 60, 380), true, "a fast flick either way")
assert.equal(L.swipeDismisses(10, 5, 380), false, "a fast tiny jitter is not a flick")

console.log(slug + ": ok")
