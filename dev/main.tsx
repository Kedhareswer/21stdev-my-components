import * as React from "react"
import { createRoot } from "react-dom/client"
import "./styles.css"

// Every demo in every component folder, found automatically. Adding a component
// folder is the only step — nothing here needs editing. Lazy, so each demo is
// its own chunk and a deployed workshop only downloads the one being viewed.
const modules = import.meta.glob<{ default: React.ComponentType }>(
  "../components/*/demo*.tsx",
)

// The index's pictures: media/<slug>/thumb.webp, 640 x 400. Optional — a component
// without one still gets its card, with its name where the picture would be.
const thumbs = import.meta.glob<string>("../media/*/thumb.webp", {
  eager: true,
  query: "?url",
  import: "default",
})

const demos = Object.entries(modules)
  .map(([path, load]) => {
    const [, slug, file] = path.match(/components\/([^/]+)\/(demo[^.]*)\.tsx$/) ?? []
    const variant = file === "demo" ? "default" : file.slice(5)
    return { id: variant === "default" ? slug : slug + "/" + variant, slug, variant, Comp: React.lazy(load) }
  })
  // Default demo first within each component, then extra variants.
  .sort((a, b) => a.id.localeCompare(b.id))

const nameOf = (slug: string) => slug.replace(/(^|-)(\w)/g, (_, dash, c) => (dash ? " " : "") + c.toUpperCase())

// slug -> unix seconds it was first committed (vite.config.ts). A folder git
// hasn't seen yet is the newest thing here, so it sorts to the top.
declare const __ADDED__: Record<string, number>
const addedAt = (slug: string) => __ADDED__[slug] ?? Number.MAX_SAFE_INTEGER

// One card per component, newest first (name breaks ties), its default demo first.
const components = [...new Set(demos.map((d) => d.slug))]
  .sort((a, b) => addedAt(b) - addedAt(a) || a.localeCompare(b))
  .map((slug) => ({
    slug,
    name: nameOf(slug),
    thumb: thumbs["../media/" + slug + "/thumb.webp"],
    demos: demos.filter((d) => d.slug === slug),
  }))

// No chrome. A toolbar sitting over a full-bleed component is the one thing the
// workshop must never do, so the demo and the theme come off the URL instead.
// No hash, or one that names no demo, is the index of every component.
const find = (hash: string) => demos.find((d) => d.id === decodeURIComponent(hash.slice(1))) ?? null
const pick = () => find(location.hash)

function Workshop() {
  const [current, setCurrent] = React.useState(pick)
  // where the index was scrolled to, to come back to it
  const indexY = React.useRef(0)

  React.useEffect(() => {
    const onHash = (e: HashChangeEvent) => {
      if (!find(new URL(e.oldURL).hash)) indexY.current = scrollY
      setCurrent(pick())
    }
    addEventListener("hashchange", onHash)
    return () => removeEventListener("hashchange", onHash)
  }, [])

  React.useEffect(() => {
    const dark = new URLSearchParams(location.search).has("dark")
    document.documentElement.classList.toggle("dark", dark)
    document.documentElement.style.colorScheme = dark ? "dark" : "light"
  }, [])

  // a demo opens at its top; the index comes back where it was left
  React.useLayoutEffect(() => {
    scrollTo(0, current ? 0 : indexY.current)
    const variant = current && current.variant !== "default" ? " / " + current.variant : ""
    document.title = (current ? nameOf(current.slug) + variant + " — " : "") + "21ST.DEV workshop"
  }, [current])

  if (!demos.length) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        No demos found. Add components/&lt;slug&gt;/demo.tsx
      </p>
    )
  }

  if (!current) return <Index />

  return (
    <div key={current.id} className="h-full w-full">
      <React.Suspense fallback={null}>
        <current.Comp />
      </React.Suspense>
    </div>
  )
}

function Index() {
  return (
    <main className="min-h-full bg-background px-4 py-10 text-foreground sm:px-8 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-border pb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">21st.dev</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Public work by @kedhareswer</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {components.length} components, {demos.length} demos. Each opens full screen; your browser's back button
              brings you back here.
            </p>
          </div>
          <a
            href="https://21st.dev/@kedhareswer"
            target="_blank"
            rel="noreferrer"
            className="text-sm underline underline-offset-4 hover:text-muted-foreground"
          >
            Install them on 21st.dev
          </a>
        </header>
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {components.map((c) => (
            <li key={c.slug}>
              <a href={"#" + c.demos[0].id} className="group block">
                <div className="aspect-[16/10] overflow-hidden rounded-md border border-border bg-muted">
                  {c.thumb ? (
                    <img
                      src={c.thumb}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={640}
                      height={400}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {c.name}
                    </div>
                  )}
                </div>
                <p className="mt-3 text-sm font-medium">{c.name}</p>
              </a>
              {c.demos.length > 1 ? (
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {c.demos.slice(1).map((d) => (
                    <a key={d.id} href={"#" + d.id} className="underline-offset-4 hover:text-foreground hover:underline">
                      {d.variant}
                    </a>
                  ))}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

console.info(
  "21st workshop — the index is " + location.origin + "/; open a demo with a hash, add ?dark for the dark check:\n" +
    demos.map((d) => "  " + location.origin + "/#" + d.id).join("\n"),
)

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Workshop />
  </React.StrictMode>,
)
