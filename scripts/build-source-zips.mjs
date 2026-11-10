// After `vite build`: give every 21st.dev template a downloadable copy of its code
// and a self-hosted cover, served from this site.
//
//   dist/source/<slug>.zip   the template's folder + every @/components/ui/<dep> it
//                            imports, with a README naming the npm packages
//   dist/<cover>             the cover image named in scripts/templates.json
//
// 21st sends a template back as "no code to download" unless its listing links
// the source. The template descriptions link these zips, so they must survive
// every rebuild; that is why this runs as part of `npm run build`.
//
// Run: node scripts/build-source-zips.mjs   (needs Node 22+ for zlib.crc32)
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { crc32, deflateRawSync } from "node:zlib"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const dist = join(root, "dist")
const { site, templates } = JSON.parse(readFileSync(join(root, "scripts", "templates.json"), "utf8"))

if (!existsSync(dist)) throw new Error("dist/ not found: run `vite build` first")

const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (name === "node_modules") return []
    return statSync(p).isDirectory() ? files(p) : [p]
  })

const CODE = /\.(tsx?|jsx?|css)$/
const SIBLING = /@\/components\/ui\/([a-z0-9-]+)/g
// import x from "pkg" · import "pkg" · the closing line of a multi-line import
const PACKAGE = /^\s*(?:import\b[^\n"']*?\bfrom|import|\}\s*from)\s*["']([a-z@][a-z0-9@/._-]*)["']/gm

function collect(slug) {
  const seen = new Set()
  const packages = new Set()
  const queue = [slug]
  while (queue.length) {
    const s = queue.shift()
    if (seen.has(s)) continue
    const dir = join(root, "components", s)
    if (!existsSync(dir)) throw new Error(`components/${s} is missing (needed by ${slug})`)
    seen.add(s)
    for (const f of files(dir).filter((f) => CODE.test(f))) {
      const src = readFileSync(f, "utf8")
      for (const m of src.matchAll(SIBLING)) queue.push(m[1])
      for (const m of src.matchAll(PACKAGE)) {
        const p = m[1]
        if (p.startsWith("@/")) continue
        packages.add(p.startsWith("@") ? p.split("/").slice(0, 2).join("/") : p.split("/")[0])
      }
    }
  }
  return { folders: [...seen], packages: [...packages].sort() }
}

// Minimal zip writer (deflate, forward-slash paths, fixed timestamp so
// unchanged code gives byte-identical zips).
function zip(entries) {
  const local = []
  const central = []
  let offset = 0
  const DOS_TIME = 0
  const DOS_DATE = (2026 - 1980) << 9 | 1 << 5 | 1
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, "utf8")
    const packed = deflateRawSync(data, { level: 9 })
    const crc = crc32(data) >>> 0
    const head = Buffer.alloc(30)
    head.writeUInt32LE(0x04034b50, 0)
    head.writeUInt16LE(20, 4)
    head.writeUInt16LE(0x0800, 6) // UTF-8 names
    head.writeUInt16LE(8, 8)
    head.writeUInt16LE(DOS_TIME, 10)
    head.writeUInt16LE(DOS_DATE, 12)
    head.writeUInt32LE(crc, 14)
    head.writeUInt32LE(packed.length, 18)
    head.writeUInt32LE(data.length, 22)
    head.writeUInt16LE(nameBuf.length, 26)
    local.push(head, nameBuf, packed)
    const dir = Buffer.alloc(46)
    dir.writeUInt32LE(0x02014b50, 0)
    dir.writeUInt16LE(20, 4)
    dir.writeUInt16LE(20, 6)
    dir.writeUInt16LE(0x0800, 8)
    dir.writeUInt16LE(8, 10)
    dir.writeUInt16LE(DOS_TIME, 12)
    dir.writeUInt16LE(DOS_DATE, 14)
    dir.writeUInt32LE(crc, 16)
    dir.writeUInt32LE(packed.length, 20)
    dir.writeUInt32LE(data.length, 24)
    dir.writeUInt16LE(nameBuf.length, 28)
    dir.writeUInt32LE(offset, 42)
    central.push(dir, nameBuf)
    offset += head.length + nameBuf.length + packed.length
  }
  const cd = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(cd.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...local, cd, end])
}

mkdirSync(join(dist, "source"), { recursive: true })
for (const { slug, cover } of templates) {
  const { folders, packages } = collect(slug)
  const entries = []
  for (const folder of folders.sort()) {
    const dir = join(root, "components", folder)
    for (const f of files(dir).sort()) {
      entries.push({ name: `${slug}/components/${folder}/${relative(dir, f).replaceAll("\\", "/")}`, data: readFileSync(f) })
    }
  }
  const readme = `# ${slug} — source code

Live demo: ${site}/#${slug}

Folders under components/ are React + TypeScript + Tailwind components.
Main file: components/${slug}/${slug}.tsx  (usage example: components/${slug}/demo.tsx)

Put each folder's .tsx file at src/components/ui/<folder>.tsx in a
shadcn-style project (the code imports siblings as @/components/ui/<name>).

npm packages used: ${packages.join(", ") || "react only"}

License: MIT. Author: Kedhareswer Naidu (https://kedhar.pages.dev).
`
  entries.unshift({ name: `${slug}/README.md`, data: Buffer.from(readme, "utf8") })
  writeFileSync(join(dist, "source", `${slug}.zip`), zip(entries))

  if (cover) {
    const src = join(root, cover)
    if (!existsSync(src)) throw new Error(`cover not found: ${cover}`)
    mkdirSync(dirname(join(dist, cover)), { recursive: true })
    copyFileSync(src, join(dist, cover))
  }
}
console.log(`source zips: ${templates.length} written to dist/source/`)
