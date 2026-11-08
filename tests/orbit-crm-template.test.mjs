// Install-safety and layout checks for components/orbit-crm-template.
// Run: node tests/orbit-crm-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"

const slug = "orbit-crm-template"
const root = new URL("../", import.meta.url)
const dir = new URL("components/" + slug + "/", root)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"))

// ---- 1. Install Safety & Dependencies ------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "only react and gsap are imported")
assert.ok(pkg.dependencies?.gsap, "gsap must be declared in root package.json")
assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger is registered")

// Verify folder holds only allowed publishable files
const folderFiles = readdirSync(dir).sort()
assert.deepEqual(folderFiles, ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only publishable files")

// tsconfig paths line check
const tsconfig = readFileSync(new URL("tsconfig.json", root), "utf8")
assert.ok(
  tsconfig.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'),
  "tsconfig paths line must exist"
)

// ---- 2. Root Height & Layout Invariants -----------------------------------------
assert.ok(src.includes('height = "100svh"'), "height defaults to definite length 100svh")
assert.ok(src.includes('"--oct-height": height'), "height prop feeds --oct-height")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full on root or stage")
assert.ok(src.includes("ctx.revert()"), "gsap context is reverted on unmount")

// 21st CLI tokenizer safety: no generic hook type parameters
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback|Context)<|Record<|Array<|Promise<|Partial</, "no <generics> on hooks for 21st CLI")

// No unicode escapes (\uXXXX) that would render literally
assert.doesNotMatch(src, /\\u[0-9a-f]{4}/i, "no raw unicode escapes in JSX")

// ---- 3. Scoped CSS & Motion Safety ----------------------------------------------
const cssMatch = src.match(/const CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "CSS block is present")
const css = cssMatch[1].replace(/\/\*[\s\S]*?\*\//g, "")
assert.doesNotMatch(css, /\$\{/, "no ${ interpolation inside CSS")

// No bare resets
for (const bad of [/(^|[},])\s*\*\s*\{/, /(^|[},])\s*body\s*\{/, /:root/, /(^|[},])\s*html\s*\{/]) {
  assert.doesNotMatch(css, bad, "no bare resets in CSS: " + bad)
}

// Prefixed selectors only
for (const rule of css.matchAll(/(?:^|[{}])\s*(?!@)([^{}\s][^{}]*)\{/g)) {
  const sel = rule[1].trim()
  if (!sel || /^(from|to|\d+%)/.test(sel)) continue
  for (const one of sel.split(/,(?![^(]*\))/)) {
    const s = one.trim()
    assert.ok(
      s.startsWith(".oct-") || s.startsWith(":where(.oct-root)") || s.startsWith(".text-center"),
      "unscoped selector: " + s
    )
  }
}

// Reduced motion support
assert.ok(css.includes("prefers-reduced-motion: reduce"), "CSS honours reduced motion")
assert.ok(src.includes('matchMedia("(prefers-reduced-motion: reduce)"'), "runtime motion check exists")

// Preflight guards for image and svg
assert.ok(css.includes(".oct-root img {\n  max-width: none;\n}") || css.includes(".oct-root img"), "images guarded against preflight")
assert.ok(css.includes(".oct-svg"), "svgs guarded against preflight")

// ---- 4. Demo Safety -------------------------------------------------------------
assert.ok(demo.includes('@/components/ui/' + slug), "demo imports from @/components/ui alias")
assert.ok(demo.includes('className="w-full"'), "demo container stays full width")

console.log(slug + ": All install-safety and structural checks PASSED! ✓")
