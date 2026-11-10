import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

import { cloudflare } from "@cloudflare/vite-plugin";

const root = fileURLToPath(new URL(".", import.meta.url)).replace(/[\\/]$/, "")

// When each component folder last changed in git, so the index can list the
// most recently updated first. Vercel clones shallow, which would stamp every
// older folder with the clone's oldest commit, and its clone has no usable
// origin to deepen from — so fall back to the public repo. No git at all just
// means no dates.
const PUBLIC_REPO = "https://github.com/Kedhareswer/21stdev-my-components.git"
function updatedDates() {
  const git = (args: string) =>
    execSync("git " + args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
  const shallow = () => git("rev-parse --is-shallow-repository").trim() === "true"
  const updated: Record<string, number> = {}
  for (const from of ["", PUBLIC_REPO + " HEAD"]) {
    try {
      if (shallow()) git("fetch --unshallow --quiet " + from)
    } catch {}
  }
  try {
    let at = 0
    // newest commit first, so the first date seen for a slug is its latest
    for (const line of git("log --format=%ct --name-only -- components").split("\n")) {
      if (/^\d+$/.test(line)) at = +line
      const slug = line.match(/^components\/([^/]+)\//)?.[1]
      if (slug && !(slug in updated)) updated[slug] = at
    }
  } catch {}
  return updated
}

export default defineConfig({
  // The harness lives in dev/ so the repo root stays just components/ + library/.
  root: "dev",
  define: { __UPDATED__: JSON.stringify(updatedDates()) },
  plugins: [react(), tailwindcss(), cloudflare()],
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