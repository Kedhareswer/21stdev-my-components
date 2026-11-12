// After `vite build`: give every 21st.dev template a downloadable copy of its code
// and a self-hosted cover, served from this site.
//
//   dist/source/<slug>.zip   a runnable Vite + React + Tailwind project: the
//                            template + every @/components/ui/<dep> it imports
//   dist/<cover>             the cover image named in scripts/templates.json
//
// The zip is laid out so it can be uploaded as-is in 21st Studio's template form,
// which refuses a zip without a package.json at its top and builds the listing's
// demo from it:
//
//   package.json  index.html  vite.config.ts  tsconfig.json  README.md  LICENSE
//   src/main.tsx  src/index.css  src/App.tsx          (App = the template's demo.tsx)
//   src/components/ui/<folder>.tsx                    (one per component folder)
//   src/demos/<demo-*.tsx>                            (any extra demo variants)
//
// npm versions come from this repo's package.json, so the zip builds with what the
// workshop builds with. The template descriptions also link these zips for
// download, so they must survive every rebuild; that is why this runs as part of
// `npm run build`.
//
// Run: node scripts/build-source-zips.mjs   (needs Node 22+ for zlib.crc32)
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
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

// The runnable project around a template: the collected files in, zip entries out.
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
const versions = { ...pkg.dependencies, ...pkg.devDependencies }
const TOOLING = ["@tailwindcss/vite", "@types/react", "@types/react-dom", "@vitejs/plugin-react", "tailwindcss", "typescript", "vite"]

const title = (slug) => slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")
const version = (name) => {
  const v = versions[name]
  if (!v) throw new Error(`${name} is imported but not declared in the root package.json`)
  return v
}

function projectEntries({ slug, folders, packages, read, readme }) {
  const runtime = [...new Set(["react", "react-dom", ...packages])].sort()
  const types = runtime.map((p) => `@types/${p.replace(/^@/, "").replace("/", "__")}`).filter((t) => versions[t])
  const dev = [...new Set([...TOOLING, ...types])].sort()
  const text = (name, s) => ({ name, data: Buffer.from(s, "utf8") })
  const entries = []

  entries.push(text("package.json", JSON.stringify({
    name: slug,
    private: true,
    version: "1.0.0",
    type: "module",
    license: "MIT",
    scripts: { dev: "vite", build: "vite build", preview: "vite preview", typecheck: "tsc --noEmit" },
    dependencies: Object.fromEntries(runtime.map((p) => [p, version(p)])),
    devDependencies: Object.fromEntries(dev.map((p) => [p, version(p)])),
  }, null, 2) + "\n"))

  entries.push(text("index.html", `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title(slug)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`))

  entries.push(text("vite.config.ts", `import { fileURLToPath, URL } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
})
`))

  entries.push(text("tsconfig.json", JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      module: "ESNext",
      moduleResolution: "bundler",
      jsx: "react-jsx",
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      isolatedModules: true,
      baseUrl: ".",
      paths: { "@/*": ["./src/*"] },
      types: ["vite/client"],
    },
    include: ["src"],
  }, null, 2) + "\n"))

  entries.push(text(".gitignore", "node_modules\ndist\n"))

  entries.push(text("src/main.tsx", `import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`))

  // The same semantic tokens the workshop gives every component (dev/styles.css).
  entries.push(text("src/index.css", `@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  --color-muted-foreground: oklch(0.556 0 0);
  --color-border: oklch(0.922 0 0);
  --color-primary: oklch(0.205 0 0);
}

.dark {
  --color-background: oklch(0.145 0 0);
  --color-foreground: oklch(0.985 0 0);
  --color-muted-foreground: oklch(0.708 0 0);
  --color-border: oklch(0.269 0 0);
  --color-primary: oklch(0.985 0 0);
}

body {
  background: var(--color-background);
  color: var(--color-foreground);
}
`))

  for (const folder of [...folders].sort()) {
    entries.push({ name: `src/components/ui/${folder}.tsx`, data: read(folder, `${folder}.tsx`) })
  }
  entries.push({ name: "src/App.tsx", data: read(slug, "demo.tsx") })
  for (const demo of readme.demos) entries.push({ name: `src/demos/${demo}`, data: read(slug, demo) })

  const body = (readme.text || "").replace(/^# .*\n+/, "")
  entries.push(text("README.md", `# ${title(slug)}

Live demo: ${site}/#${slug}

\`\`\`bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
\`\`\`

The template is \`src/components/ui/${slug}.tsx\`; \`src/App.tsx\` renders it.
${folders.length > 1 ? `It uses ${folders.filter((f) => f !== slug).map((f) => `\`src/components/ui/${f}.tsx\``).join(", ")}.\n` : ""}React + Vite + Tailwind CSS v4${packages.length ? `, plus ${packages.join(", ")}` : ""}.

License: MIT. Author: Kedhareswer Naidu (https://kedhar.pages.dev).
${body ? `\n---\n\n${body}` : ""}`))

  entries.push(text("LICENSE", `MIT License

Copyright (c) 2026 Kedhareswer Naidu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`))
  return entries
}

mkdirSync(join(dist, "source"), { recursive: true })
for (const { slug, cover } of templates) {
  const { folders, packages } = collect(slug)
  const dir = join(root, "components", slug)
  const read = (folder, file) => {
    const p = join(root, "components", folder, file)
    if (!existsSync(p)) throw new Error(`components/${folder}/${file} is missing (needed by ${slug})`)
    return readFileSync(p)
  }
  const readmePath = join(dir, "README.md")
  const readme = {
    text: existsSync(readmePath) ? readFileSync(readmePath, "utf8") : "",
    demos: readdirSync(dir).filter((f) => /^demo-.+\.tsx$/.test(f)).sort(),
  }
  const entries = projectEntries({ slug, folders, packages: packages.filter((p) => p !== "react" && p !== "react-dom"), read, readme })
  writeFileSync(join(dist, "source", `${slug}.zip`), zip(entries))

  if (cover) {
    const src = join(root, cover)
    if (!existsSync(src)) throw new Error(`cover not found: ${cover}`)
    mkdirSync(dirname(join(dist, cover)), { recursive: true })
    copyFileSync(src, join(dist, cover))
  }
}
console.log(`source zips: ${templates.length} written to dist/source/`)
