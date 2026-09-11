import * as React from "react"
import { createRoot } from "react-dom/client"
import "./styles.css"

// Every demo in every component folder, found automatically. Adding a component
// folder is the only step — nothing here needs editing.
const modules = import.meta.glob<{ default: React.ComponentType }>(
  "../components/*/demo*.tsx",
  { eager: true },
)

const demos = Object.entries(modules)
  .map(([path, mod]) => {
    const [, slug, file] = path.match(/components\/([^/]+)\/(demo[^.]*)\.tsx$/) ?? []
    const variant = file === "demo" ? "default" : file.slice(5)
    return { id: variant === "default" ? slug : slug + "/" + variant, Comp: mod.default }
  })
  // Default demo first within each component, then extra variants.
  .sort((a, b) => a.id.localeCompare(b.id))

// No chrome. A toolbar sitting over a full-bleed component is the one thing the
// workshop must never do, so the demo and the theme come off the URL instead.
const pick = () => {
  const id = decodeURIComponent(location.hash.slice(1))
  return demos.find((d) => d.id === id) ?? demos[0]
}

function Workshop() {
  const [current, setCurrent] = React.useState(pick)

  React.useEffect(() => {
    const onHash = () => setCurrent(pick())
    addEventListener("hashchange", onHash)
    return () => removeEventListener("hashchange", onHash)
  }, [])

  React.useEffect(() => {
    const dark = new URLSearchParams(location.search).has("dark")
    document.documentElement.classList.toggle("dark", dark)
    document.documentElement.style.colorScheme = dark ? "dark" : "light"
  }, [])

  if (!current) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        No demos found. Add components/&lt;slug&gt;/demo.tsx
      </p>
    )
  }

  return (
    <div key={current.id} className="h-full w-full">
      <current.Comp />
    </div>
  )
}

console.info(
  "21st workshop — open a demo with a hash, add ?dark for the dark check:\n" +
    demos.map((d) => "  " + location.origin + "/#" + d.id).join("\n"),
)

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Workshop />
  </React.StrictMode>,
)
