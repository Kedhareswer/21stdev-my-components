import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const root = fileURLToPath(new URL(".", import.meta.url)).replace(/[\\/]$/, "")

export default defineConfig({
  // The harness lives in dev/ so the repo root stays just components/ + library/.
  root: "dev",
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
})
