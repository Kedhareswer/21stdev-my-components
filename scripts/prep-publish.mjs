// Emit a publish-ready copy of a component folder.
//
// Why this exists: Studio lays a component out as src/components/ui/<slug> with
// demos at src/demos/<name>.tsx, and its "@/" alias is a literal path swap that
// does NOT probe extensions — so `@/components/ui/foo` fails to resolve there
// with ENOENT while a relative import resolves normally. This repo's layout is
// one folder per component, where the relative path Studio wants is meaningless.
// Both cannot be true in one file, so the import is rewritten on the way out.
//
//   node scripts/prep-publish.mjs <slug>
//
// Prints the directory to publish from.
import { mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"

const slug = process.argv[2]
if (!slug) {
  console.error("usage: node scripts/prep-publish.mjs <slug>")
  process.exit(1)
}

const src = join("components", slug)
const out = join("output", "publish-src", slug)
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

const files = readdirSync(src).filter((f) => f.endsWith(".tsx"))
if (!files.includes(slug + ".tsx")) {
  console.error(`missing ${slug}.tsx in ${src}`)
  process.exit(1)
}

let rewritten = 0
for (const f of files) {
  const before = readFileSync(join(src, f), "utf8")
  const after = before.replaceAll("@/components/ui/", "../components/ui/")
  if (after !== before) rewritten++
  writeFileSync(join(out, f), after)
}

console.log(out)
console.error(`prepared ${files.length} file(s), rewrote imports in ${rewritten}`)
