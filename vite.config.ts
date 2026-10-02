import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const root = fileURLToPath(new URL(".", import.meta.url)).replace(/[\\/]$/, "")

// When each component folder first landed in git, so the index can list newest
// first. Vercel clones shallow, which would stamp every older folder with the
// clone's oldest commit — deepen first. No git at all just means no dates.
function addedDates() {
  const git = (args: string) =>
    execSync("git " + args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
  const added: Record<string, number> = {}
  try {
    if (git("rev-parse --is-shallow-repository").trim() === "true") git("fetch --unshallow --quiet")
  } catch {}
  try {
    let at = 0
    // newest commit first, so the last date written for a slug is its oldest
    for (const line of git("log --diff-filter=A --format=%at --name-only -- components").split("\n")) {
      if (/^\d+$/.test(line)) at = +line
      const slug = line.match(/^components\/([^/]+)\//)?.[1]
      if (slug) added[slug] = at
    }
  } catch {}
  return added
}

export default defineConfig({
  // The harness lives in dev/ so the repo root stays just components/ + library/.
  root: "dev",
  define: { __ADDED__: JSON.stringify(addedDates()) },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // Demos import the path a 21st installer ends up with. Map it back onto
      // this repo's one-folder-per-component layout: @/components/ui/foo-bar
      // resolves to components/foo-bar/foo-bar.tsx. No per-component wiring.
      {
        find: /^@\/components\/ui\/([^/]+)$/,
        replacement: root + "/components/$1/$1.tsx",
      },
    ],
  },
  server: {
    // components/ and tests/ sit above dev/.
    fs: { allow: [root] },
  },
  build: {
    // Hosts' Vite presets (Vercel, Netlify, Cloudflare) serve <repo>/dist, not
    // dev/dist. Outside root, Vite only clears the folder when told to.
    outDir: "../dist",
    emptyOutDir: true,
  },
})
