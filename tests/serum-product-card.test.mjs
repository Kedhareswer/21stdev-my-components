// Install-safety and behaviour check for components/serum-product-card.
// Run: node tests/serum-product-card.test.mjs
import assert from "node:assert/strict"
import { readFileSync, statSync } from "node:fs"

const src = readFileSync(new URL("../components/serum-product-card/serum-product-card.tsx", import.meta.url), "utf8")
const demo = readFileSync(new URL("../components/serum-product-card/demo.tsx", import.meta.url), "utf8")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
assert.match(src, /height = "100svh"/, "section height defaults to a definite length")
assert.ok(src.includes("minHeight: height"), "the section carries the height prop as its minimum")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /`/, "no backticks in the file")
assert.doesNotMatch(src, /\$\{/, "no ${ in the file")
assert.doesNotMatch(src, /useRef</, "no useRef generics")
assert.doesNotMatch(src, /(^|[{}"])\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.ok(Buffer.byteLength(src) < 200 * 1024, "21st rejects component files over 200 kB")
assert.match(demo, /from "@\/components\/ui\/serum-product-card"/, "demo imports the installed path")
assert.ok(tsconfig.includes('"@/components/ui/serum-product-card"'), "tsconfig needs its paths line")
assert.doesNotMatch(src, /serum-dive-scroll-hero/, "independent of the hero")
assert.ok(!/var\(--color-/.test(src), "assumes no theme tokens: the dark teal is its own")
const imports = src.match(/^import .* from "([^"]+)"/gm) || []
assert.deepEqual(imports.map((l) => l.replace(/.*from "/, "").replace(/"$/, "")), ["react"], "React is the only import")
assert.ok(src.includes(".spc-root img{max-width:none}") && src.includes('maxWidth: "none"'), "Preflight guard on the photo")
assert.ok(src.includes("width={1000} height={1000}"), "the photo carries explicit width/height")
assert.doesNotMatch(src, /scale\(/, "nothing is enlarged with transform: scale")

// The photo comes from the catalog site and exists locally.
assert.ok(src.includes('"https://kedhar-components.pages.dev/serum-product-card/serum.webp"'), "photo from the catalog")
assert.ok(statSync(new URL("../dev/public/serum-product-card/serum.webp", import.meta.url)).size > 20000, "serum.webp present")
const hosts = new Set((src.match(/https:\/\/[a-z0-9.-]+/gi) || []).map((u) => u.toLowerCase()))
for (const h of hosts) assert.ok(["https://kedhar-components.pages.dev", "https://fonts.googleapis.com"].includes(h), "unexpected host " + h)
for (const banned of [/clair/i, /ascenta/i, /instagram/i]) assert.doesNotMatch(src, banned, "no reference identifiers: " + banned)

// Behaviour.
assert.ok(src.includes('role="radiogroup"') && src.includes('role="radio"') && src.includes("aria-checked={i === sel}"), "sizes are a radio group")
assert.ok(src.includes('e.key !== "ArrowRight" && e.key !== "ArrowLeft"'), "arrow keys move between sizes")
assert.ok(src.includes("<span key={price}>{price}</span>"), "the price re-mounts, so it rolls, on a size change")
assert.equal((src.match(/<span key=\{price\}>\{price\}<\/span>/g) || []).length, 2, "both prices roll together")
assert.ok(src.includes("aria-expanded={open}") && src.includes('"All " + ingredients.length + " ingredients"'), "accordion with a counted label")
assert.ok(src.includes("grid-template-rows:0fr") && src.includes("grid-template-rows:1fr"), "accordion opens on a height transition")
assert.ok(src.includes("setTimeout(() => setAdded(false), 1600)"), "the added state settles back")
assert.ok(src.includes("@media (prefers-reduced-motion:reduce)") && src.includes('"(prefers-reduced-motion: reduce)"'), "honours reduced motion")
assert.ok(src.includes(".spc-root[data-in=false] .spc-card{transform:translate3d(0,44px,0);opacity:0}"), "the card rises in")
assert.ok(src.includes("if (r.top < window.innerHeight * 0.85) return"), "a card already on screen never hides itself")
assert.ok(src.includes("@media (max-width:720px){.spc-card{grid-template-columns:1fr}"), "stacks on narrow screens")

// --- price formatting, executed -------------------------------------------
const start = src.indexOf("// #region price")
const end = src.indexOf("// #endregion price")
assert.ok(start > 0 && end > start, "price region present")
const body = src.slice(start, end).replace(/export /g, "").replace(/: (string|number)/g, "")
const { formatPrice } = new Function(body + "\nreturn { formatPrice }")()
assert.equal(formatPrice("$", 64), "$64")
assert.equal(formatPrice("$", 86), "$86")
assert.equal(formatPrice("€", 12.5), "€12.50")

console.log("serum-product-card: all checks passed")
