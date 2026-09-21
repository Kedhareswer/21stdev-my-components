// The three preset-focused preloaders are generated from the same engine as
// tumbling-cube-preloader, so this runs the install-safety rules over all of
// them at once and asserts the engine has not drifted between copies.
// Run: node tests/preloader-family.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const FAMILY = [
  { slug: "cinema-grain-preloader", comp: "CinemaGrainPreloader", preset: "cinema", word: "LOADER", reel: "tears-of-steel-battle-clip-medium.mp4" },
  { slug: "chroma-glitch-preloader", comp: "ChromaGlitchPreloader", preset: "chroma", word: "GLITCH", reel: "flower.mp4" },
  { slug: "mono-contrast-preloader", comp: "MonoContrastPreloader", preset: "highcontrast", word: "ARCHIVE", reel: "friday.mp4" },
]

const read = (slug, file) =>
  readFileSync(new URL(`../components/${slug}/${file}`, import.meta.url), "utf8")

for (const v of FAMILY) {
  const src = read(v.slug, `${v.slug}.tsx`)
  const demo = read(v.slug, "demo.tsx")
  const where = (m) => `${v.slug}: ${m}`

  // ---- baked defaults ------------------------------------------------------
  assert.ok(src.includes(`function ${v.comp}(`), where("component function is renamed"))
  assert.ok(src.includes(`shaderPreset = "${v.preset}"`), where("preset is baked in"))
  assert.ok(src.includes(`word = "${v.word}"`), where("word is baked in"))
  assert.ok(src.includes(v.reel), where("reel is baked in"))

  // Each variant must carry its own identifiers, or two of them installed side
  // by side would collide on the exported type names.
  assert.doesNotMatch(src, /TumblingCube/, where("no leftover identifiers from the source component"))

  // ---- the demo is the component, full bleed, nothing else -----------------
  assert.ok(demo.includes(`<${v.comp} loop />`), where("demo renders the component looping"))
  assert.doesNotMatch(demo, /<select|<input|<button|<label/, where("demo must not ship controls"))
  assert.doesNotMatch(demo, /absolute|fixed|z-\[/, where("demo must not overlay anything on the component"))
  // A wrapper would letterbox a full-bleed component inside the 21st frame.
  assert.doesNotMatch(demo, /<div/, where("demo must not wrap the component in a container"))

  // ---- install safety ------------------------------------------------------
  const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(imports, ["react"], where("react is the only import"))
  assert.doesNotMatch(src, /@import/, where("no @import"))
  assert.doesNotMatch(src, /^\s*(\*|body|html|:root)\s*\{/m, where("no bare global resets"))
  assert.ok(src.includes('height = "100svh"'), where("height defaults to a definite length"))
  assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, where("no h-full"))
  assert.ok(src.includes("prefers-reduced-motion"), where("honours reduced motion"))
  assert.ok(src.includes('role="progressbar"'), where("reports progress to assistive tech"))

  const css = src.match(/const TCP_CSS = `([\s\S]*?)`/)
  assert.ok(css, where("CSS block present"))
  assert.doesNotMatch(css[1], /\$\{|`/, where("no interpolation inside the CSS string"))
  assert.match(
    css[1],
    /\.tcp-root video, \.tcp-root canvas \{[^}]*max-width: none/,
    where("video/canvas override Preflight's max-width"),
  )

  for (const match of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
    const sel = match[1].trim()
    if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
    assert.ok(
      sel.split(",").every((x) => x.trim().startsWith(".tcp-")),
      where(`unscoped CSS selector would leak into the host app: ${sel}`),
    )
  }

  // ---- no third-party branding or hotlinks --------------------------------
  for (const brand of [/donprod/i, /double or nothing/i, /born risk takers/i, /director showcase/i]) {
    assert.doesNotMatch(src + demo, brand, where(`branded string must not ship: ${brand}`))
  }
  for (const url of (src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)) {
    assert.match(
      url[0],
      /^https:\/\/mdn\.github\.io\/shared-assets\//,
      where(`external asset must be a CORS-enabled, openly licensed clip: ${url[0]}`),
    )
  }
}

// ---- the engine must be identical across the family ------------------------
// Only the header comment, the identifiers and the three defaults may differ.
// Anything else diverging means a hand-edit landed in one copy and not the rest.
const normalise = (slug, comp) =>
  read(slug, `${slug}.tsx`)
    .replace(/\r\n/g, "\n")
    // the per-variant header comment between "use client" and the import
    .replace(/^"use client"\n[\s\S]*?\nimport /, '"use client"\n\nimport ')
    .replace(new RegExp(comp.replace("Preloader", ""), "g"), "X")
    .replace(/word = "[A-Z]+"/, 'word = "W"')
    .replace(/videoSrc = "[^"]*"/, 'videoSrc = "V"')
    .replace(/shaderPreset = "[a-z]+"/, 'shaderPreset = "P"')
    .split("\n")

const reference = normalise(FAMILY[0].slug, FAMILY[0].comp)
for (const v of FAMILY.slice(1)) {
  const lines = normalise(v.slug, v.comp)
  const i = reference.findIndex((line, n) => line !== lines[n])
  assert.ok(
    i === -1 && lines.length === reference.length,
    `${v.slug} has drifted from ${FAMILY[0].slug} beyond its baked defaults, at line ${i + 1}:\n` +
      `  ${FAMILY[0].slug}: ${JSON.stringify(reference[i])}\n` +
      `  ${v.slug}: ${JSON.stringify(lines[i])}`,
  )
}

console.log(`preloader-family: ok (${FAMILY.length} components, engines identical)`)
