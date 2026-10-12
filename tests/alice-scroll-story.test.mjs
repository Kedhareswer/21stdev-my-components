// Install-safety checks for alice-scroll-story.
// Run: node tests/alice-scroll-story.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const root = new URL("../", import.meta.url)
const src = readFileSync(new URL("components/alice-scroll-story/alice-scroll-story.tsx", root), "utf8")
const demo = readFileSync(new URL("components/alice-scroll-story/demo.tsx", root), "utf8")
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"))

// Every import is react or gsap, and gsap is declared at the root so the 21st
// build gate (which rejects undeclared imports) and installers both resolve it.
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.ok(imports.length > 0)
for (const i of imports) assert.ok(i === "react" || i === "gsap" || i.startsWith("gsap/"), "unexpected import: " + i)
assert.ok(pkg.dependencies && pkg.dependencies.gsap, "gsap must be declared in the root package.json")

assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger is registered")
assert.match(src, /const styles = `/, "styles ship inside the file")
assert.doesNotMatch(src.match(/const styles = `([\s\S]*?)`/)[1], /\$\{/, "no interpolation in the CSS string")
assert.doesNotMatch(src, /console\./, "no debug logging ships")

const di = [...demo.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(di, ["@/components/ui/alice-scroll-story"], "demo imports only the component")

console.log("alice-scroll-story: ok")
