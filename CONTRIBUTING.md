# Contributing & Authoring Guide

How this repo is organized, how work gets published to [21st.dev](https://21st.dev/@kedhareswer), and the rules that keep every piece install-safe.

---

## 1. Layout

Only **two** top-level folders are publishable. Everything else is local-only.

```text
/
├── components/          # one folder per component, flat
│   ├── alice-scroll-story/
│   ├── glass-clock/
│   ├── mouse-trail/
│   └── ...
│
├── library/             # one folder per library, flat
│   └── my-library-a/
│
└── (anything else at root is ignored — drafts, notes, scripts, tooling)
```

### The three rules

1. **Only `components/` and `library/` ship.** `drafts/`, `experiments/`, `notes/`, `archive/`, `dev/`, `tests/` never reach 21st.
2. **Flat, one folder per piece.** No grouping by type. Every child folder is a standalone publishable unit.
3. **One install, at the root.** There is exactly one `package.json` and one `node_modules/`, both at the repo root. Component folders never get their own — no nested `package.json`, no per-folder `npm install`, no workspaces.

### Naming

Folder name = slug: lowercase, kebab-case, specific, unique.

✅ **Do this**

```text
components/
  ├── pricing-comparison-table/
  ├── analytics-data-table/
  └── booking-history-table/
```

❌ **Never this**

```text
components/
  ├── tables/          # no grouping by type
  │   ├── table1/
  │   └── table2/
  └── cards/
      ├── card1/
      └── card2/
```

Three tables = three siblings with real names. Same rule inside `library/`.

**Slugs are frozen.** Once published, a folder name never changes — renaming breaks installs and the 21st URL (`21st.dev/@kedhareswer/components/mouse-trail`).

### Dependencies

Every dependency a component needs is installed once, at the root:

```bash
npm install            # from the repo root, always
npm install gsap       # a new component dep goes in the root package.json
```

Why: 21st ships **one component file plus its demos** and resolves packages against the installer's own `package.json`. A nested `node_modules/` would make a component build locally and break on install — the exact failure this repo exists to prevent. One root install means what you run locally is what an installer gets.

Two consequences worth knowing:

- **Declare the dep in the root `package.json` before you use it.** The 21st build gate rejects undeclared imports.
- **Note per-folder deps in that folder's README** (e.g. "requires `gsap`"), so someone copying the source knows what to install. The root `package.json` is the union of every component's needs — it is not a promise that any single component needs all of them.

## 2. Folder anatomy

### `components/<slug>/`

```text
components/mouse-trail/
  ├── mouse-trail.tsx       # the component (Tailwind + scoped <style> if needed)
  ├── demo.tsx              # default demo (default-exported, capitalized / contains "demo")
  ├── demo-*.tsx            # optional: loading, empty, dark, etc.
  └── README.md             # optional: what it does, props, notes
```

Required for 21st installs to work:

- **Styles live in the component file.** Tailwind utilities preferred; complex CSS (keyframes, `clip-path`, scroll layouts) as a scoped inline `<style>` block.
- **No bare `*`, `body`, or `:root` resets.** No `@import` (fonts or Tailwind). No backticks or `${` inside the CSS string.
- **Explicit `width`/`height` on animated media**, and guard against Tailwind Preflight (e.g. `img { max-width: 100% }` collapsing absolutely-positioned images).
- **Demos exercise the states worth seeing.** Full-bleed components stay full-bleed — no centering wrapper that shrinks them.
- **No local imports that won't travel.** 21st installs only what you ship.

### `library/<slug>/`

```text
library/<my-library>/
  ├── src/                  # library source
  ├── demo/                 # usage examples
  └── README.md             # what it is, install, usage, contents
```

Each library is independent — no imports from sibling folders. Shared code gets vendored in so the published unit works standalone.

## 3. The workshop

`dev/` is a Vite harness for previewing what you are building. It is local-only and never publishes.

```bash
npm install      # once, at the root
npm run dev      # http://localhost:5173
npm run check    # tsc --noEmit across components/ and dev/
npm test         # node --test — runs tests/*.test.mjs
```

It **auto-discovers every `components/*/demo*.tsx`** — no registration step. Add a folder with a demo and it is reachable immediately.

There is deliberately **no toolbar**: a bar sitting over a full-bleed component is exactly what the workshop must not do. The demo and the theme come off the URL instead, and the available links are printed to the console on load.

```
http://localhost:5173/#zero-melt-preloader             # default demo
http://localhost:5173/#zero-melt-preloader/strict      # a demo-*.tsx variant
http://localhost:5173/?dark#zero-melt-preloader        # the dark check 21st requires
```

`dev/styles.css` is deliberately bare: `@import "tailwindcss"` plus only the semantic tokens (`--color-background`, `--color-foreground`, `--color-muted-foreground`, `--color-border`, `--color-primary`) a component is allowed to assume. If a piece needs anything more than that to look right, it will not survive installation.

**Imports:** demos import the path an installer ends up with — `@/components/ui/<slug>`. `vite.config.ts` maps that pattern onto this repo's layout, so nothing per-component is needed for `npm run dev`. `tsc` cannot expand a wildcard twice, so `npm run check` needs **one line per component** in `tsconfig.json` → `paths`.

## 4. Publishing workflow

1. **Build** inside the folder in this repo.
2. **Prepare** — `node scripts/prep-publish.mjs <slug>`, and publish from the directory it prints.

   Studio lays a component out as `src/components/ui/<slug>` with demos at `src/demos/<name>.tsx`, and **its `@/` alias is a literal path swap that does not probe extensions** — so `@/components/ui/foo` dies there with `ENOENT: no such file or directory`. A relative import resolves normally. That relative path is meaningless in this repo's one-folder-per-component layout, so the demo keeps `@/` here and the script rewrites it on the way out.

3. **Verify** — `npm run dev` for the bare-Tailwind check in both themes, the **stripped-height check** below, then **`21st render <file> --demo <demo>` on the prepared copy, once per demo.**

   Do not skip this. A demo that fails to compile in Studio surfaces as **"Cover failed"** in the review UI, which reads like a screenshot problem and is not one. `21st render` prints the real build error in about a minute; publishing to find out costs three and tells you nothing useful.

   **Pass the demo as `./demo.tsx`, not `demo.tsx`.** A bare filename is not
   treated as a path: the CLI finds no demo, silently synthesises a counter
   ("Component Example / 0 / - +") and renders *that* at exit 0. It reads as a
   component that renders wrong, and it is neither — re-run with the `./`.

   Two different failures wear that same label, and the output tells them apart:

   | Render output | Meaning |
   |---|---|
   | `Could not load src/components/ui/<slug> … ENOENT` | You rendered the repo copy, not the prepared one. Re-run step 2. |
   | `Building …` → `Capture request left its allowed origin` | It compiles. The **capture sandbox blocks external origins** — an off-site image, video or font. Supply your own `--preview`; server covers will never generate for this component. |

   Confirmed by control: `zero-melt-preloader` (no external assets) renders at exit 0, `magic-hour` (remote MP4 + poster) builds and then fails at capture. If you are unsure which you are looking at, render a known-good component the same way.

4. **Publish** to 21st with stable metadata:
   - `--name` — human Title Case
   - `--slug` — stable kebab-case (matches the folder)
   - `--description` — 10+ chars: what it does + when to use it
   - `--tags` — 3–6
   - `--registry` — `ui` | `blocks` | `hooks` | `icons`
   - `--preview` — cover image
5. **Set the component's own description and tags.** `21st publish --description/--tags` writes to the *draft*, not to the component record — the entry keeps its own pair and a fresh publish leaves them empty. `--name`, `--slug` and `--registry` do stick; only these two are affected.

   ```bash
   21st edit component:<id> --type component \
     --description "What it does and when to use it." \
     --tags scroll,video,motion
   ```

   Invented tags are **dropped silently** — 21st has a fixed vocabulary, so `scrub` and `cinemagraph` vanish with no warning or error. Reuse terms that already appear on published components.

6. **Tag the demo by hand in Studio — the CLI cannot.** There are *two*
   tag records, and `--tags` / `21st edit` only reach the first:

   | Record | Set by | Shows up as |
   |---|---|---|
   | Component (`component:<id>`) | `21st edit --tags` | the browse chips on the public page |
   | Demo (`?edit=<demoId>`) | **Studio form only** | demo discovery |

   The CLI has no demo-scoped endpoint (`/api/v1/components/...` and the draft
   routes are all of it) and its tRPC passthrough is only wired for `gradients`
   and `ascii`. So after publishing, open the component in Studio, go to the
   **Demo** tab, and fill `Tags *` from the search dropdown — free text does not
   stick, only picked chips. Max 5.

   This one is invisible from the terminal: the public page renders the
   component tags and looks fully tagged while the demo field is still empty.

7. **Verify it actually landed.** The CLI prints `Published.` and returns `{"state":"published"}` even when the live entry does not move. Check the server:

   ```bash
   21st components --status all --scope all | grep <slug>   # did updatedAt move?

   curl -s "https://21st.dev/@kedhareswer/components/<slug>" > /tmp/p.html
   grep -oE 'name="description" content="[^"]{0,120}' /tmp/p.html   # yours, or the generic fallback?
   grep -oE '/s/[a-z0-9-]+' /tmp/p.html | sort -u                   # one /s/<tag> per stored tag
   ```

   If `updatedAt` is unchanged, it did not publish, whatever the exit code said. And `updatedAt` moving only proves the **code** shipped — a component can be live with a blank listing, showing the generic `"A React component by <author>. High-quality React component from the community."` meta description and no tags. Count the `/s/` links; they are the only proof step 5 took.

   `visibility: "unlisted"` on a fresh publish is the normal pre-featuring state, not a failure. It flips to `public` when the component is featured, which `21st submit <slug>` starts.

8. **Commit** here so repo and registry stay in sync.

### The stripped-height check

`dev/styles.css` sets `html, body, #root { height: 100% }`. **An installed page has no such chain.** Any component whose layout is percentage-based below its root — `h-full`, `h-[500%]`, `h-[calc(100%-…)]`, sticky-scroll scrubbers — renders correctly in the workshop and collapses to 0px on 21st. Elements with intrinsic height still paint, so the result reads as "some UI, no images" rather than an obvious break, and every other check still passes.

Strip the chain and assert real pixels before publishing:

```js
// in the Playwright check, before page.goto
await page.addInitScript(() => {
  addEventListener("DOMContentLoaded", () => {
    const s = document.createElement("style")
    s.textContent = "html,body,#root{height:auto !important;min-height:0 !important}"
    document.head.appendChild(s)
  })
})
// then assert size, not presence — a 0px element is still in the DOM
// el.getBoundingClientRect().height > 0
```

A component carries an explicit `height` prop defaulting to a definite length (`100svh`) rather than inheriting one. **Never ship `h-full` on a component root.**

## 5. Adding new work

```bash
mkdir -p components/<your-unique-slug>
```

- ✅ Good names: `festivity-hero`, `glass-clock`, `scroll-book`
- ❌ Bad names: `tables/table1`, `hero1`, `test`, `new-component`

Then:

1. Write `<slug>.tsx` + at least one `demo.tsx` (import the component as `@/components/ui/<slug>`).
2. Add its line to `tsconfig.json` → `paths` so `npm run check` can see it.
3. Any new npm dependency goes in the **root** `package.json`, and gets a note in the folder README.
4. `npm run dev` → check both themes → `npm run check` → publish → commit.

The slug is frozen from that point on.

Work in progress stays **outside** `components/` and `library/` (e.g. in `drafts/`) until it earns a unique folder and passes verification.

## 6. Ignored

- Any top-level path other than `components/` and `library/` — `dev/`, `tests/`, `.github/`, `drafts/`, `experiments/`, `notes/`, tooling configs, dotfiles.
- The root `package.json`, `tsconfig.json` and `vite.config.ts` — they exist to run the workshop, and 21st resolves packages against the *installer's* project, not this one.
- Standard noise: `node_modules/`, `.next/`, `dist/`, `build/`, `.DS_Store`, editor files.

## 7. Tech stack

- **React + TypeScript** — default export, capitalized component and demo names
- **Tailwind CSS** — assumes the installer has Tailwind; verified against a bare `@import "tailwindcss"` page
- **shadcn-compatible** — installable via `shadcn add` registry URLs
- **Optional animation deps** (GSAP, Framer Motion) installed at the root, noted in the folder README, never assumed globally

## 8. Issues & PRs

Bug in a published piece? Open an issue with the folder name (`components/<slug>`), repro steps, and a screenshot.

PRs welcome if they keep the component self-contained and add or extend a demo.
