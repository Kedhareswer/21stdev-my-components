// lilac-dusk-canopy and moonlit-canopy are dappled-canopy with another default
// preset, published as their own listings. tests/dappled-canopy.test.mjs covers
// the shader and install safety; this keeps the copies from drifting off it.
// Run: node tests/canopy-variants.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const read = (slug) =>
  readFileSync(new URL(`../components/${slug}/${slug}.tsx`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
// the header's first two lines are each variant's own description
const body = (s) => s.replace(/^( \* ).*\n \* .*\n/m, "")
const base = body(read("dappled-canopy"))

for (const [slug, comp, preset] of [
  ["lilac-dusk-canopy", "LilacDuskCanopy", "lilac-dusk"],
  ["moonlit-canopy", "MoonlitCanopy", "moonlit"],
]) {
  const src = read(slug)
  assert.match(src, new RegExp(`preset = "${preset}"`), `${slug} defaults to ${preset}`)
  const back = body(src)
    .replaceAll(comp, "DappledCanopy")
    .replace(`preset = "${preset}"`, 'preset = "apricot"')
    .replaceAll(`"${slug}:"`, '"dappled-canopy:"')
  assert.equal(back, base, `${slug} has drifted from dappled-canopy`)
}
